import { CustomizationService, Scene, UserService } from 'app-services';
import { BuffedClient } from 'components-react/pages/onboarding/BuffedClient';
import { Services } from 'components-react/service-provider';
import { IObsListInput } from 'components/obs/inputs/ObsInput';
import electron from 'electron';
import { Inject } from 'services/core/injector';
import { SourcesService } from 'services/sources';
import { OS, byOS, getOS } from 'util/operating-systems';
import { EObsSimpleEncoder } from './output';

export interface OBSSettings {
  width: string;
  height: string;
  fps: string;
  rate_control: string;
  bitrate: string;
  max_bitrate: string;
  keyint_sec: string;
  preset: string;
  profile: string;
  tune: string;
  auto_streaming: boolean;
}
function sleep(ms: number) {
  console.log(`Sleep for ${ms}`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    this.sourcesService.sourceUpdated.subscribe(source => {
      if (source.type === 'game_capture') {
        this.fitScreenContent();
      }
    });
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

    try {
      const isMac = byOS({ [OS.Windows]: false, [OS.Mac]: true });
      if (isMac) {
        const item = scene.createAndAddSource('Screen Capture', 'screen_capture', {}, {});
      } else {
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

        console.log(`Source properties:`);
        console.log(sourceProperties);

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
      }
    } catch (error) {
      console.log('SOMETHING FAILED!', error);
    }
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

  fitScreenContent() {
    console.log(`>>>>>>>> Fit to screen all selection.`);
    const { ScenesService } = Services;
    const actScene = ScenesService.views.activeScene;
    const sceneSelection = actScene.getSelection();
    const sceneItems = actScene.getItems();
    console.log(`Adding ${sceneItems.length} items to selection.`);
    sceneSelection.add(sceneItems);
    sceneSelection.fitToScreen();
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
