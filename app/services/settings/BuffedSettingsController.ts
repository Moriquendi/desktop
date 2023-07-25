import { Services } from 'components-react/service-provider';
import { ISourceAddOptions, TSourceType } from 'services/sources';

export class BuffedSettingsController {
  async otherStuff() {
    Services.SettingsService.setSettingValue('Output', 'RecRB', false);
  }

  async setBuffedDetaultSettings() {
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
    VideoSettingsService.setVideoSetting('baseWidth', 1280, 'horizontal');
    VideoSettingsService.setVideoSetting('baseHeight', 720, 'horizontal');

    VideoSettingsService.setVideoSetting('outputWidth', 1280, 'horizontal');
    VideoSettingsService.setVideoSetting('outputHeight', 720, 'horizontal');

    VideoSettingsService.setVideoSetting('fpsType', 0, 'horizontal');
    VideoSettingsService.setVideoSetting('fpsNum', 60, 'horizontal');
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
        param.value = 'VBR';
      } else if (param.name === 'bitrate') {
        param.value = '2000';
      } else if (param.name === 'keyint_sec') {
        param.value = 2;
      } else if (param.name === 'preset') {
        param.value = 'faster';
      } else if (param.name === 'profile') {
        param.value = 'high';
      } else if (param.name === 'tune') {
        param.value = 'zerolatency';
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
    console.log(`nested sources`);
    console.log(nested);

    const hasAddedSources =
      ScenesService.views.activeScene.getNestedSources().filter(s => s.type === 'screen_capture')
        .length > 0;
    if (hasAddedSources) {
      console.log(`Sources are added. Skipping...`);
      return;
    } else {
      console.log(`Adding source`);
    }

    const activeSceneId = ScenesService.views.activeSceneId;
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
  }
}
