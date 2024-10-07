import { CustomizationService, Scene, SceneItem, UserService } from 'app-services';
import { BuffedClient } from 'components-react/pages/onboarding/BuffedClient';
import { Services } from 'components-react/service-provider';
import { IObsListInput } from 'components/obs/inputs/ObsInput';
import electron from 'electron';
import { Inject } from 'services/core/injector';
import { SourcesService } from 'services/sources';
import { OS, byOS, getOS } from 'util/operating-systems';
import { EObsSimpleEncoder } from './output';
import { Source } from '../sources/source';
import { OBSSettings } from 'components-react/pages/onboarding/BuffedTypes';
import Utils from 'services/utils';

function sleep(ms: number) {
  console.log(`Sleep for ${ms}`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type BuffedCaptureSource = 'game' | 'display';

export class BuffedSettingsController {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() sourcesService: SourcesService;

  async otherStuff() {
    Services.SettingsService.actions.setSettingValue('Output', 'RecRB', false);
  }

  private getDefaultSettings(): OBSSettings {
    const settings: OBSSettings = {
      width: '1280',
      height: '720',
      fps: '60',
      rate_control: 'VBR',
      bitrate: '2000',
      max_bitrate: '6000', // TODO: Set this
      keyint_sec: '2',
      preset: 'faster',
      profile: 'high',
      tune: 'zerolatency',
      auto_streaming: false,
    };
    return settings;
  }

  setup() {
    this.sourcesService.sourceAdded.subscribe(async source => {
      console.log('[BUFFED] Source ADDED ', source.type);
      if (
        source.type === 'game_capture' ||
        source.type === 'screen_capture' ||
        source.type === 'display_capture' ||
        source.type === 'monitor_capture'
      ) {
        console.log('[Buffed] Will fit to screen.');
        this.fitScreenContent();
      }
    });

    this.sourcesService.sourceUpdated.subscribe(async source => {
      console.log('SOURCE UPDATED:', source);

      if (source.type === 'game_capture') {
        this.fitScreenContent();
      }
    });
  }

  getActiveSourceType(): BuffedCaptureSource | null {
    if (this.getActiveSceneItemsWithSourceType('game').length > 0) {
      return 'game';
    } else if (this.getActiveSceneItemsWithSourceType('display').length > 0) {
      return 'display';
    } else {
      return null;
    }
  }

  getActiveSceneItemsWithSourceType(type: BuffedCaptureSource): SceneItem[] {
    const { ScenesService } = Services;
    const scene = ScenesService.views.activeScene;

    if (!scene) {
      console.log('[****] Scene is null!');
      return [];
    }

    const items = scene.getNestedItems();
    let lookForTypes: string[];
    switch (type) {
      case 'display':
        lookForTypes = ['screen_capture', 'display_capture', 'monitor_capture'];
        break;
      case 'game':
        lookForTypes = ['game_capture'];
        break;
    }

    const match = items.filter(s => lookForTypes.includes(s.type));
    return match ?? [];
  }

  async addSourceForType(type: BuffedCaptureSource): Promise<void> {
    console.log(`[Action] AddSourceForType ${type}`);
    const { ScenesService, EditorCommandsService, SourcesService } = Services;
    const scene: Scene | null = ScenesService.views.activeScene;
    const isMac = byOS({ [OS.Windows]: false, [OS.Mac]: true });

    switch (type) {
      case 'display':
        console.log('Adding DISPLAY');
        const t = isMac ? 'screen_capture' : 'monitor_capture';
        const item = scene.createAndAddSource('Screen Capture', t, {}, {});
        break;
      case 'game':
        try {
          // if (isMac) {
          //   // Not supported on mac
          //   console.log('Game not supported on Mac. Use Display instead');
          //   this.addSourceForType('display');
          //   return;
          // } else {
          console.log('Adding GAME');
          const item = scene.createAndAddSource(
            'Game Capture',
            'game_capture',
            {},
            {
              sourceAddOptions: {
                propertiesManager: 'default',
                propertiesManagerSettings: {},
                guestCamStreamId: undefined,
                sourceId: undefined,
              },
              display: 'horizontal',
              id: undefined,
            },
          );

          const sourceId = item.sourceId;
          const source = SourcesService.views.getSource(sourceId)!;
          const sourceProperties = source.getPropertiesFormData();

          // console.log(`Source properties:`);
          // console.log(sourceProperties);

          const captureModeProp = sourceProperties.find(v => v.name === 'capture_mode');
          if (captureModeProp) {
            captureModeProp.value = 'any_fullscreen';
            console.log(`Would set this:`);
            console.log(captureModeProp);
            EditorCommandsService.actions.executeCommand(
              'EditSourcePropertiesCommand',
              source.sourceId,
              [captureModeProp],
            );
          }
          // }
          break;
        } catch (error) {
          console.log('SOMETHING FAILED!', error);
        }
    }
  }

  async setSourceSettingsFor(source: BuffedCaptureSource) {
    const { ScenesService } = Services;
    const scene: Scene | null = ScenesService.views.activeScene;

    // Remove counter-source
    const counterSourceType: BuffedCaptureSource = source === 'display' ? 'game' : 'display';
    console.log(`Remove counter source if needed: ${counterSourceType}`);

    const counterItems = this.getActiveSceneItemsWithSourceType(counterSourceType);
    if (counterItems.length > 0) {
      console.log('REMOVING ', counterItems[0].type);
      for (const counterItem of counterItems) {
         scene.removeItem(counterItem.sceneItemId);
      }
    }

    if (this.getActiveSceneItemsWithSourceType(source).length === 0) {
      console.log(`Tell to add source ${source}`);
      this.addSourceForType(source);
    } else {
      console.log('Skip. Theres already active source for it');
    }
  }

  async setBuffedDetaultSettings() {
    // this.userService.views.streamSettingsServiceViews;
    const client = new BuffedClient();

    let settings: OBSSettings = this.getDefaultSettings();

    const token = this.userService.views.auth?.apiToken;
    if (token) {
      console.log(`[Buffed settings] Updating settings based on fetched profile...`);
      try {
        const profile = await client.profile(token);
        console.log(`[Buffed settings] Fetched. `, profile.obs_settings);
        settings = profile.obs_settings ?? settings;

        if (!settings.auto_streaming) {
          // disable it in setting in case it comes as false
          this.customizationService.actions.setAutoStreamEnabled(false);
        }
      } catch {
        console.log(`[Buffed settings] FAILED fetch.`);
      }
    } else {
      console.log(`[Buffed settings] Updating settings to default values.`);
    }

    /// Inform Games Monitor about state for streaming
    electron.ipcRenderer.send('SET_AUTO_STREAMING_STATE', settings.auto_streaming);

    await this.otherStuff();
    const {
      ScenesService,
      SettingsService,
      EditorCommandsService,
      VideoSettingsService,
      SourcesService,
    } = Services;

    // VIDEO SETTINGS //
    // Base res

    const w = parseInt(settings.width);
    const h = parseInt(settings.height);
    const fps = parseInt(settings.fps);

    VideoSettingsService.actions.setVideoSetting('baseWidth', w, 'horizontal');
    VideoSettingsService.actions.setVideoSetting('baseHeight', h, 'horizontal');

    VideoSettingsService.actions.setVideoSetting('outputWidth', w, 'horizontal');
    VideoSettingsService.actions.setVideoSetting('outputHeight', h, 'horizontal');

    VideoSettingsService.actions.setVideoSetting('fpsType', 0, 'horizontal');
    VideoSettingsService.actions.setVideoSetting('fpsNum', fps, 'horizontal');
    VideoSettingsService.actions.setVideoSetting('fpsDen', 1, 'horizontal');
    // this.setCustomResolution('baseRes', false);
    // this.setResolution('baseRes', '1280x720');
    // // Output res
    // this.setCustomResolution('outputRes', false);
    // this.setResolution('outputRes', '1280x720');
    // // Common fps
    // setCommonFPS(60);

    // OUTPUT
    const outputFormData = SettingsService.state['Output']?.formData ?? [];
    const streamingData = outputFormData.find(v => v.nameSubCategory === 'Streaming');
    streamingData!.parameters.forEach(param => {
      if (param.name === 'rate_control') {
        param.value = settings.rate_control;
      } else if (param.name === 'bitrate') {
        param.value = settings.bitrate;
      } else if (param.name === 'keyint_sec') {
        param.value = parseInt(settings.keyint_sec);
      } else if (param.name === 'preset') {
        param.value = settings.preset;
      } else if (param.name === 'profile') {
        param.value = settings.profile;
      } else if (param.name === 'tune') {
        param.value = settings.tune;
      }
    });

    const genericData = outputFormData.find(v => v.nameSubCategory === 'Untitled');
    genericData?.parameters.forEach(param => {
      if (param.name === 'Mode') {
        param.value = 'Advanced';
      }
    });
    Services.SettingsService.actions.setSettings('Output', outputFormData);

    this.ensureValidEncoder();

    // ADD SOURCE

    console.log(`Service: ${ScenesService.views}`);
    console.log(`Active scene: ${ScenesService.views.activeScene}`);

    const scene: Scene | null = ScenesService.views.activeScene;
    const hasAddedSources =
      ScenesService.views.activeScene
        ?.getNestedSources()
        .filter(s => s.type === 'screen_capture' || s.type === 'game_capture').length > 0;
    if (hasAddedSources) {
      console.log(`Sources are added. Skipping...`);
      return;
    } else {
      console.log(`Adding source`);
    }

    // const activeSceneId = ScenesService.views.activeSceneId;
    // const source = SourcesService.createSource('Screen Capture', 'screen_capture', {}, {});
    // SourcesService.addSource('Screen Capture', {}, {})

    this.addSourceForType('game');

    ////////////////////////////////////////
    // FIT TO SCREN'
    console.log('SHCEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEDULE');
    // setTimeout(() => {
    //   console.log('after delay. 00000000000000000000000000000000');
    //   this.fitScreenContent();
    // }, 3000); // 1000 milliseconds (1 second) delay

    /////////////
    // console.log(`adding color block`);
    // const blockItem = scene.createAndAddSource(
    //   'Color Block',
    //   'color_source',
    //   {},
    //   {
    //     sourceAddOptions: {
    //       propertiesManager: 'default',
    //       propertiesManagerSettings: {},
    //       guestCamStreamId: undefined,
    //       sourceId: undefined,
    //     },
    //   },
    // );
    ///////////////////////////////////

    // const source = await SourcesService.createSource(
    //   'Game Capture',
    //   'game_capture',
    //   {},
    //   {
    //     propertiesManager: 'default',
    //     propertiesManagerSettings: {}
    //   }
    //   );

    /*
    const name = 'Screen Capture A';
    const sourceType: TSourceType = 'screen_capture';
    const settings: Dictionary<any> = {};

    const sourceAddOptions: ISourceAddOptions = {
      propertiesManager: 'default',
      propertiesManagerSettings: {},
      //guestCamStreamId: //sourceAddOptions.guestCamStreamId,
    };
    const item = await EditorCommandsService.actions.return.executeCommand(
      'CreateNewItemCommand',
      activeSceneId,
      name,
      sourceType,
      settings,
      {
        sourceAddOptions: sourceAddOptions,
      },
    );

    const screenSource = ScenesService.views.activeScene
      .getNestedSources()
      .filter(s => s.type === 'screen_capture');
    // console.log(`sourceId: ${sourceId}`);

    const sourceId = screenSource[0].sourceId;

    console.log(`Available sources: ${SourcesService.views.sources.map(s => s.sourceId)}`);
    const source = SourcesService.views.getSource(sourceId)!;
    const field = 'capture_source_list';
    const val = 'game:1';
    const result = await EditorCommandsService.actions.executeCommand(
      'EditSourceSettingsCommand',
      sourceId,
      {
        [field]: val,
      },
    );
    console.log(`result: ${result}`);
    */
  }

  async fitScreenContent() {
    let retry = 0;
    await Utils.sleep(20);

    while (true) {
      console.log(`>>>>>>>> Fit to screen all selection.`);
      const { ScenesService } = Services;
      const actScene = ScenesService.views.activeScene;
      const sceneSelection = actScene.getSelection();
      const sceneItems = actScene.getItems();
      console.log(`Adding ${sceneItems.length} items to selection.`);
      if (sceneItems.length > 0) {
        sceneSelection.add(sceneItems);
        sceneSelection.fitToScreen();
      }

      if (retry > 6) {
        console.log('Did reach max retry. Failing.');
        break;
      }
      if (sceneItems.length === 0 || sceneItems[0].rectangle.width === 0) {
        console.log('Fit to screen failed. Will try again after a delay.]', retry);
        await Utils.sleep(100 + 200 * retry);
        retry += 1;
      } else {
        break;
      }

      if (sceneItems.length > 0) {
        console.log('RRR: ', sceneItems[0].rectangle);
      }
    }
  }

  private ensureValidEncoder() {
    console.log('>>>>>>> Ensure valid encoder');
    if (getOS() === OS.Mac) return;
    const { SettingsService } = Services;

    // disable 'visual tunning' setting stupid
    SettingsService.setSettingsPatch({ Output: { psycho_aq: false } });

    const encoderSetting: IObsListInput<string> =
      SettingsService.findSetting(SettingsService.state.Output.formData, 'Streaming', 'Encoder') ??
      SettingsService.findSetting(
        SettingsService.state.Output.formData,
        'Streaming',
        'StreamEncoder',
      );
    const encoderIsValid = !!encoderSetting.options.find(opt => opt.value === encoderSetting.value);

    const theOptions = encoderSetting.options.map(o => o.value);
    if (theOptions.includes(EObsSimpleEncoder.jim_nvenc)) {
      console.log('>>>>>>>>> jim_nvenc set');
      SettingsService.setSettingValue('Output', 'Encoder', EObsSimpleEncoder.jim_nvenc);
    }
  }
}
