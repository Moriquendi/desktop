import { Service } from './core/service';
import Util from 'services/utils';
import { Inject } from './core/injector';
import { ViewHandler } from './core';

// Hands out hostnames to the rest of the app. Eventually
// we should allow overriding this value. But for now we
// are just keeping the value in one place.
export class HostsService extends Service {
  get streamlabs() {
    if (Util.shouldUseLocalHost()) {
      return 'buffed.site';
    } else if (Util.shouldUseBeta()) {
      return 'beta.buffed.me';
    }

    return 'buffed.me';
  }

  get overlays() {
    return 'overlays.buffed.me';
  }

  get media() {
    return 'media.buffed.me';
  }

  get io() {
    if (Util.shouldUseLocalHost()) {
      return 'http://io.buffed.site:4567';
    } else if (Util.shouldUseBeta()) {
      return 'https://beta.buffed.me';
    }

    return 'https://aws-io.buffed.me';
  }

  get cdn() {
    return 'cdn.buffed.me';
  }

  get platform() {
    return 'platform.buffed.me';
  }

  get analitycs() {
    return 'r2d2.buffed.me';
  }
}

export class UrlService extends Service {
  @Inject('HostsService') private hosts: HostsService;

  get protocol() {
    return Util.shouldUseLocalHost() ? 'http://' : 'https://';
  }

  getStreamlabsApi(endpoint: string) {
    return `${this.protocol}${this.hosts.streamlabs}/api/v5/slobs/${endpoint}`;
  }
}
