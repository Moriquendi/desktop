import { UserService } from 'app-services';
import { BuffedClient } from 'components-react/pages/onboarding/BuffedClient';
import { Services } from 'components-react/service-provider';
import { Inject } from 'services/core/injector';
import { ISourceAddOptions, TSourceType } from 'services/sources';

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
}

export class BuffedSettingsController {
  @Inject() userService: UserService;

  async otherStuff() {
    Services.SettingsService.setSettingValue('Output', 'RecRB', false);
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
    };
    return settings;
  }

  async setBuffedDetaultSettings() {
    this.userService.views.streamSettingsServiceViews;
    const client = new BuffedClient();

    let settings: OBSSettings = this.getDefaultSettings();

    const token = this.userService.views.auth?.apiToken;
    if (token) {
      console.log(`[Buffed settings] Updating settings based on fetched profile...`);
      try {
        const profile = await client.profile(token);
        console.log(`[Buffed settings] Fetched. `, profile.obs_settings);
        settings = profile.obs_settings ?? settings;
      } catch {
        console.log(`[Buffed settings] FAILED fetch.`);
      }
    } else {
      console.log(`[Buffed settings] Updating settings to default values.`);
    }

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

    VideoSettingsService.setVideoSetting('baseWidth', w, 'horizontal');
    VideoSettingsService.setVideoSetting('baseHeight', h, 'horizontal');

    VideoSettingsService.setVideoSetting('outputWidth', w, 'horizontal');
    VideoSettingsService.setVideoSetting('outputHeight', h, 'horizontal');

    VideoSettingsService.setVideoSetting('fpsType', 0, 'horizontal');
    VideoSettingsService.setVideoSetting('fpsNum', fps, 'horizontal');
    VideoSettingsService.setVideoSetting('fpsDen', 1, 'horizontal');
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
    Services.SettingsService.setSettings('Output', outputFormData);

    // ADD SOURCE

    const nested = ScenesService.views.activeScene.getNestedSources();

    const hasAddedSources =
      ScenesService.views.activeScene
        .getNestedSources()
        .filter(s => s.type === 'screen_capture' || s.type === 'game_capture').length > 0;
    if (hasAddedSources) {
      console.log(`Sources are added. Skipping...`);
      return;
    } else {
      console.log(`Adding source`);
    }

    const activeSceneId = ScenesService.views.activeSceneId;

    // const source = SourcesService.createSource('Screen Capture', 'screen_capture', {}, {});
    // SourcesService.addSource('Screen Capture', {}, {})

    const scene = ScenesService.views.activeScene;
    const item = scene.createAndAddSource('Game Capture', 'game_capture', {}, {});
    const sourceId = item.sourceId;

    const source = SourcesService.views.getSource(sourceId)!;

    // const source = await SourcesService.createSource(
    //   'Game Capture',
    //   'game_capture',
    //   {},
    //   {
    //     propertiesManager: 'default',
    //     propertiesManagerSettings: {}
    //   }
    //   );

    const sourceProperties = source.getPropertiesFormData();

    console.log(`Source properties:`);
    console.log(sourceProperties);

    const captureModeProp = sourceProperties.find(v => v.name === 'capture_mode');
    if (captureModeProp) {
      captureModeProp.value = 'any_fullscreen';
      console.log(`Would set this:`);
      console.log(captureModeProp);
      EditorCommandsService.executeCommand('EditSourcePropertiesCommand', source.sourceId, [
        captureModeProp,
      ]);
    }

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
}
