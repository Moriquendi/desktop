import { Service } from 'services/core/service';
import electron from 'electron';
import url from 'url';
import { Inject } from 'services/core/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService } from 'services/platform-apps';
import { PlatformAppStoreService } from 'services/platform-app-store';
import { UserService } from 'services/user';
import { SettingsService } from './settings';
import { byOS, OS } from 'util/operating-systems';
import { GuestCamService } from './guest-cam';
import { SideNavService, ESideNavKey, ProtocolLinkKeyMap } from './side-nav';
import { EStreamingState, StreamingService } from './streaming';
import { CustomizationService } from './customization';
import Utils from './utils';

function protocolHandler(base: string) {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    target.handlers = target.handlers || {};
    target.handlers[base] = methodName;
    return descriptor;
  };
}

/**
 * Describes a protocol link that was clicked
 */
interface IProtocolLinkInfo {
  base: string;
  path: string;
  query: URLSearchParams;
}

export class ProtocolLinksService extends Service {
  @Inject() navigationService: NavigationService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() platformAppStoreService: PlatformAppStoreService;
  @Inject() userService: UserService;
  @Inject() settingsService: SettingsService;
  @Inject() guestCamService: GuestCamService;
  @Inject() sideNavService: SideNavService;
  @Inject() streamingService: StreamingService;
  @Inject() customizationService: CustomizationService;

  // Maps base URL components to handler function names
  private handlers: Dictionary<string>;

  start(argv: string[]) {
    // Other instances started with a protocol link will receive this message
    electron.ipcRenderer.on('protocolLink', (event: Electron.Event, link: string) => {
      console.log(`Protocol: handle link: ${link}`);
      this.handleLink(link);
    });

    // Check if this instance was started with a protocol link
    byOS({
      [OS.Windows]: () => {
        argv.forEach(arg => {
          if (arg.match(/^me\.buffed\.app\.desktop:\/\//)) this.handleLink(arg);
        });
        electron.ipcRenderer.send('protocolLinkReady');
      },
      [OS.Mac]: () => {
        electron.ipcRenderer.send('protocolLinkReady');
      },
    });
  }

  private handleLink(link: string) {
    console.log(`HANDLE LINK: ${link}`);
    const parsed = new url.URL(link);
    const info: IProtocolLinkInfo = {
      base: parsed.host,
      path: parsed.pathname,
      query: parsed.searchParams,
    };

    if (this.handlers[info.base]) {
      this[this.handlers[info.base]](info);
    }
  }

  @protocolHandler('library')
  private navigateLibrary(info: IProtocolLinkInfo) {
    if (!this.userService.isLoggedIn) return;

    const parts = info.path.match(/^\/(.+)\/(.+)$/);
    if (parts) {
      this.navigationService.navigate('BrowseOverlays', {
        type: parts[1],
        id: parts[2],
      });
      const menuItem =
        ProtocolLinkKeyMap[parts[1]] ?? this.sideNavService.views.isOpen
          ? ESideNavKey.Scene
          : ESideNavKey.Themes;
      this.sideNavService.setCurrentMenuItem(menuItem);
    }
  }

  @protocolHandler('alertbox-library')
  private navigateAlertboxLibrary(info: IProtocolLinkInfo) {
    if (!this.userService.isLoggedIn) return;

    const match = info.path.match(/^\/?([0-9]+)?\/?$/);

    if (match) {
      this.navigationService.navigate('AlertboxLibrary', { id: match[1] });
      this.sideNavService.setCurrentMenuItem(ESideNavKey.AlertBoxLibrary);
    }
  }

  @protocolHandler('paypalauth')
  private updateUserBillingInfo(info: IProtocolLinkInfo) {
    if (!this.userService.isLoggedIn) return;

    this.platformAppStoreService.paypalAuthSuccess();
  }

  @protocolHandler('auth')
  private handleAuthDeeplink(info: IProtocolLinkInfo) {
    const token = info.query.get('token');
    const userId = info.query.get('user_id');

    console.log('handleAuthDeeplink', info);
    this.userService.continueSocialAuth(token, userId);
  }

  @protocolHandler('app')
  private navigateApp(info: IProtocolLinkInfo) {
    console.log(`Protocol: app`);

    if (!this.userService.isLoggedIn) return;

    const appId = info.path.replace('/', '');

    if (this.platformAppsService.views.getApp(appId)) {
      this.navigationService.navigate('PlatformAppMainPage', { appId });
      this.sideNavService.setCurrentMenuItem(appId);
    } else {
      this.navigationService.navigate('PlatformAppStore', { appId });
      this.sideNavService.setCurrentMenuItem(ESideNavKey.AppsStoreHome);
    }
  }

  @protocolHandler('settings')
  private openSettings(info: IProtocolLinkInfo) {
    console.log(`Protocol: settings`);

    const category = info.path.replace('/', '');

    this.settingsService.showSettings(category);
  }

  @protocolHandler('join')
  private guestCamJoin(info: IProtocolLinkInfo) {
    const hash = info.path.replace('/', '');

    this.guestCamService.joinAsGuest(hash);
  }

  @protocolHandler('autostream')
  private async autoStream(info: IProtocolLinkInfo) {
    console.log('Handle autostream link');

    if (!this.customizationService.state.autoStreamEnabled) {
      console.log('Auto stream disabled. Ignore deeplink.');
    }

    const shouldStart = info.query.get('start') === 'true';
    const streamingModel = this.streamingService.getModel();
    const isOffline = streamingModel.streamingStatus == EStreamingState.Offline;

    if (isOffline && shouldStart) {
      console.log('Will turn on streaming.');
      console.log(`Make sure app is shown...`);
      await electron.ipcRenderer.invoke('SHOW_APP');
      console.log(`Wait for app to finish init...`);
      await this.awaitForAllSetupDone();
      console.log(`STREAMING GO`);
      this.streamingService.toggleStreaming();
    } else if (!isOffline && !shouldStart) {
      console.log('Turning off streaming.');
      this.streamingService.toggleStreaming();
    } else {
      console.warn('No action.');
    }
  }

  private async awaitForAllSetupDone() {
    // Todo: make it smarter.
    // Now, when we toggleStreaming right away, it is stuck in 'starting' state.
    await Utils.sleep(1500);
    return;
  }
}
