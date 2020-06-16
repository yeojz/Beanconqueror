import {AfterViewInit, Component, ViewChild, ViewEncapsulation} from '@angular/core';

import {IonRouterOutlet, MenuController, ModalController, Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {UILog} from '../services/uiLog';
import {UIBeanStorage} from '../services/uiBeanStorage';
import {UIBrewStorage} from '../services/uiBrewStorage';
import {UIPreparationStorage} from '../services/uiPreparationStorage';
import {UIMillStorage} from '../services/uiMillStorage';
import {UISettingsStorage} from '../services/uiSettingsStorage';
import {AppMinimize} from '@ionic-native/app-minimize/ngx';
import {Keyboard} from '@ionic-native/keyboard/ngx';
import {ThreeDeeTouch} from '@ionic-native/three-dee-touch/ngx';
import {Mill} from '../classes/mill/mill';
import {Brew} from '../classes/brew/brew';
import {Router} from '@angular/router';
import {BeansAddComponent} from './beans/beans-add/beans-add.component';
import {PreparationAddComponent} from './preparation/preparation-add/preparation-add.component';
import {MillAddComponent} from './mill/mill-add/mill-add.component';
import {UIBrewHelper} from '../services/uiBrewHelper';
import {BrewAddComponent} from './brew/brew-add/brew-add.component';
import {Bean} from '../classes/bean/bean';

import {UIHelper} from '../services/uiHelper';
import {UIAlert} from '../services/uiAlert';
import {TranslateService} from '@ngx-translate/core';
import {Globalization} from '@ionic-native/globalization/ngx';
import {Settings} from '../classes/settings/settings';
import {STARTUP_VIEW_ENUM} from '../enums/settings/startupView';
import {UIAnalytics} from '../services/uiAnalytics';
import {WelcomePopoverComponent} from '../popover/welcome-popover/welcome-popover.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements AfterViewInit {
  public toggleAbout: boolean = false;
  public registerBackFunction: any;
  @ViewChild(IonRouterOutlet, {static: false}) public routerOutlet: IonRouterOutlet;

  public pages = {
    home: {title: 'NAV_HOME', url: '/home/dashboard', icon: 'home-outline', active: true},
    settings: {title: 'NAV_SETTINGS', url: '/settings', icon: 'settings-outline', active: false},

    info: {title: 'NAV_INFORMATION_TO_APP', url: '/info', icon: 'information-circle-outline', active: false},
    about: {title: 'NAV_ABOUT_US', url: '/info/about', icon: 'information-circle-outline', active: false},
    contact: {title: 'NAV_CONTACT', url: '/info/contact', icon: 'mail-outline', active: false},
    privacy: {title: 'NAV_PRIVACY', url: '/info/privacy', icon: 'documents-outline', active: false},
    credits: {title: 'NAV_CREDITS', url: '/info/credits', icon: 'documents-outline', active: false},
    terms: {title: 'NAV_TERMS', url: '/info/terms', icon: 'documents-outline', active: false},
    thanks: {title: 'NAV_THANKS', url: '/info/thanks', icon: 'happy-outline', active: false},
    licences: {title: 'NAV_LICENCES', url: '/info/licences', icon: 'copy-outline', active: false},

    statistic: {title: 'NAV_STATISTICS', url: '/statistic', icon: 'analytics-outline', active: false},
    logs: {title: 'NAV_LOGS', url: '/info/logs', icon: 'logo-buffer', active: false},
    helper_brew_ratio: {title: 'PAGE_HELPER_BREW_RATIO', url: '/helper/brew-ratio', icon: 'construct-outline', active: false},
    helper_water_hardness: {title: 'PAGE_HELPER_WATER_HARDNESS', url: '/helper/water-hardness', icon: 'construct-outline', active: false},
    brew_parameter: {title: 'NAV_BREW_PARAMS', url: '/brew-parameter', icon: 'construct-outline', active: false}
  };


  constructor(
    private readonly router: Router,
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    private readonly uiLog: UILog,
    private readonly uiBeanStorage: UIBeanStorage,
    private readonly uiBrewStorage: UIBrewStorage,
    private readonly uiPreparationStorage: UIPreparationStorage,
    private readonly uiMillStorage: UIMillStorage,
    private readonly uiBrewHelper: UIBrewHelper,
    private readonly menuCtrl: MenuController,
    private readonly appMinimize: AppMinimize,
    private readonly uiSettingsStorage: UISettingsStorage,
    private readonly keyboard: Keyboard,
    private readonly threeDeeTouch: ThreeDeeTouch,
    private readonly modalCtrl: ModalController,
    private readonly uiHelper: UIHelper,
    private readonly uiAlert: UIAlert,
    private _translate: TranslateService,
    private  globalization: Globalization,
    private readonly uiAnalytics: UIAnalytics,
    private readonly menu: MenuController,
  ) {
  }

  public ngAfterViewInit(): void {

    this.uiLog.log('Platform ready, init app');
    this.__appReady();
    // Copy in all the js code from the script.js. Typescript will complain but it works just fine
  }


  public dismiss() {
    this.menu.close();
  }


  private __appReady(): void {
    this.platform.ready()
        .then(() => {
          this.__showWelcomePopover();
          // Okay, so the platform is ready and our plugins are available.
          // Here you can do any higher level native things you might need.

          // #7
          this.statusBar.show();
          this.splashScreen.hide();
          this.keyboard.hideFormAccessoryBar(false);


          if (this.platform.is('ios')) {
            this.uiLog.log(`iOS Device - attach to home icon pressed`);
            this.threeDeeTouch.onHomeIconPressed()
              .subscribe(
                async (payload) => {
                  /* We need to wait for app finished loading, but already attach on platform start, else
                  *  the event won't get triggered **/
                  this.uiHelper.isBeanconqurorAppReady().then(async () => {
                    const payloadType = payload.type;
                    try {
                      this.uiAnalytics.trackEvent('STARTUP', 'FORCE_TOUCH_' + payloadType.toUpperCase());
                      this.uiLog.log(`iOS Device - Home icon was pressed`);
                    } catch (ex) {
                    }
                    if (payload.type === 'Brew') {
                      await this.__trackNewBrew();
                    } else if (payload.type === 'Bean') {
                      await this.__trackNewBean();
                    } else if (payload.type === 'Preparation') {
                      await this.__trackNewPreparation();
                    } else if (payload.type === 'Mill') {
                      await this.__trackNewMill();
                    }
                  });
                  // returns an object that is the button you presed

                }
              );
          }

          // Wait for every necessary service to be ready before starting the app
          const beanStorageReadyCallback = this.uiBeanStorage.storageReady();
          const preparationStorageReadyCallback = this.uiPreparationStorage.storageReady();
          const uiSettingsStorageReadyCallback = this.uiSettingsStorage.storageReady();
          const brewStorageReadyCallback = this.uiBrewStorage.storageReady();
          const millStorageReadyCallback = this.uiMillStorage.storageReady();
          Promise.all([
            beanStorageReadyCallback,
            preparationStorageReadyCallback,
            brewStorageReadyCallback,
            uiSettingsStorageReadyCallback,
            millStorageReadyCallback
          ])
              .then(() => {
                this.uiLog.log('App finished loading');
                this.uiLog.info('Everything should be fine!!!');
                this.__checkUpdate();
                this.__initApp();
                this.uiHelper.setAppReady(1);

              }, () => {
                this.uiAlert.showMessage('APP_COULD_NOT_STARTED_CORRECTLY_BECAUSE_MISSING_FILESYSTEM', 'CARE', undefined, true);
                this.uiLog.error('App finished loading, but errors occured');
                this.__initApp();
                this.uiHelper.setAppReady(2);
              });
        });

  }

  private __checkUpdate(): void {
    if (this.uiBrewStorage.getAllEntries().length > 0 && this.uiMillStorage.getAllEntries().length <= 0) {
      // We got an update and we got no mills yet, therefore we add a Standard mill.
      const data: Mill = new Mill();
      data.name = 'Standard';
      this.uiMillStorage.add(data);

      const brews: Array<Brew> = this.uiBrewStorage.getAllEntries();
      for (const brew of brews) {
        brew.mill = data.config.uuid;

        this.uiBrewStorage.update(brew);
      }
    }
    // We made an update, filePath just could storage one image, but we want to storage multiple ones.
    if (this.uiBeanStorage.getAllEntries().length > 0) {
      const beans: Array<Bean> = this.uiBeanStorage.getAllEntries();
      for (const bean of beans) {
        if (bean.filePath !== undefined && bean.filePath !== null && bean.filePath !== '') {
          bean.attachments.push(bean.filePath);
          bean.filePath = '';
        }
        bean.fixDataTypes();
        this.uiBeanStorage.update(bean);
      }

    }
    // Fix wrong types
    if (this.uiBrewStorage.getAllEntries().length > 0) {
      const brews: Array<Brew> = this.uiBrewStorage.getAllEntries();
      for (const brew of brews) {
        brew.fixDataTypes();
        this.uiBrewStorage.update(brew);
      }
    }
  }

  private async __setDeviceLanguage(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (this.platform.is('cordova')) {
        try {
          this.uiLog.info('Its a mobile device, try to set language now');
          const settings: Settings = this.uiSettingsStorage.getSettings();
          if (settings.language === null || settings.language === undefined || settings.language === '') {
            this.globalization.getPreferredLanguage().then(async (res) => {
              // Run other functions after getting device default lang
              let systemLanguage: string = res['value'].toLowerCase();
              this.uiLog.log(`Found system language: ${systemLanguage}`);
              if (systemLanguage.indexOf('-') > -1) {
                systemLanguage = systemLanguage.split('-')[0];
              }

              let settingLanguage: string = '';
              switch (systemLanguage) {
                case 'de':
                  settingLanguage = 'de';
                  break;
                default:
                  settingLanguage = 'en';
                  break;
              }
              this.uiLog.log(`Setting language: ${settingLanguage}`);
              this._translate.setDefaultLang(settingLanguage);
              settings.language = settingLanguage;
              this.uiSettingsStorage.saveSettings(settings);
              await this._translate.use(settingLanguage).toPromise();
              resolve();

            })
              .catch(async (ex) => {
                const exMessage: string = JSON.stringify(ex);
                this.uiLog.error(`Exception occured when setting language ${exMessage}`);
                this._translate.setDefaultLang('en');
                await this._translate.use('en').toPromise();
                resolve();
              });
          } else {
            this.uiLog.info('Language settings already existing, set language');
            const settingLanguage: string = settings.language;
            this.uiLog.log(`Setting language: ${settingLanguage}`);
            this._translate.setDefaultLang(settingLanguage);
            settings.language = settingLanguage;
            this.uiSettingsStorage.saveSettings(settings);
            await this._translate.use(settingLanguage).toPromise();
            resolve();

          }
        } catch (ex) {
          const exMessage: string = JSON.stringify(ex);
          this.uiLog.error(`Exception occured when setting language ${exMessage}`);
          this._translate.setDefaultLang('en');
          await this._translate.use('en').toPromise();
          resolve();
        }
      } else {
        this.uiLog.info('Cant set language for device, because no cordova device');
        const settings: Settings = this.uiSettingsStorage.getSettings();
        if (settings.language !== null && settings.language !== undefined && settings.language !== '') {
          this.uiLog.info(`Set language from settings: ${settings.language}`);
          this._translate.setDefaultLang(settings.language);
          await this._translate.use(settings.language).toPromise();
          resolve();
        } else {
          this.uiLog.info(`Set default language from settings, because no settings set: de `);
          this._translate.setDefaultLang('de');
          await this._translate.use('de').toPromise();
          resolve();
        }

      }
    });
  }

  private async __checkStartupView() {
    return;
    const settings: Settings = this.uiSettingsStorage.getSettings();

    if (settings.startup_view !== STARTUP_VIEW_ENUM.HOME_PAGE) {
      this.uiAnalytics.trackEvent('STARTUP', 'STARTUP_VIEW_' + settings.startup_view);
    }
    switch (settings.startup_view) {
      case STARTUP_VIEW_ENUM.HOME_PAGE:
        this.router.navigate(['/home/dashboard']);
        break;
      case STARTUP_VIEW_ENUM.BREW_PAGE:
        this.router.navigate(['/home/brews']);
        break;
      case STARTUP_VIEW_ENUM.ADD_BREW:
        await this.__trackNewBrew();
        break;
    }
  }

  private async __initApp() {
    this.__registerBack();
    await this.__setDeviceLanguage();
    await this.uiAnalytics.initializeTracking().catch(() => {
      // Nothing to do, user declined tracking.
    });
    await this.__checkStartupView();



  }

  private async __trackNewBrew() {

    if (this.uiBrewHelper.canBrew()) {
      const modal = await this.modalCtrl.create({component: BrewAddComponent});
      await modal.present();
      await modal.onWillDismiss();
    }

  }


  private async __showWelcomePopover() {


    const modal = await this.modalCtrl.create({component: WelcomePopoverComponent});
    await modal.present();
    await modal.onWillDismiss();


  }

  private async __trackNewBean() {

    const modal = await this.modalCtrl.create({component: BeansAddComponent});
    await modal.present();
    await modal.onWillDismiss();

  }

  private async __trackNewPreparation() {
    const modal = await this.modalCtrl.create({component: PreparationAddComponent});
    await modal.present();
    await modal.onWillDismiss();
    this.router.navigate(['/']);

  }

  private async __trackNewMill() {
    const modal = await this.modalCtrl.create({component: MillAddComponent});
    await modal.present();
    await modal.onWillDismiss();
    this.router.navigate(['/']);

  }

  private __registerBack() {
    this.platform.backButton.subscribeWithPriority(0, () => {
      if (this.routerOutlet && this.routerOutlet.canGoBack()) {
        this.routerOutlet.pop();
      } else if (this.router.url === '/home') {
        this.appMinimize.minimize();
        // or if that doesn't work, try
        // navigator['app'].exitApp();
      } else {
        // this.generic.showAlert("Exit", "Do you want to exit the app?", this.onYesHandler, this.onNoHandler, "backPress");
      }
    });
  }
  /*private __registerBack(): void {
    if (this.registerBackFunction !== undefined && this.registerBackFunction !== undefined) {
      return;
    }
    this.registerBackFunction = this.platform.registerBackButtonAction(() => {
      const activePortal = this.ionicApp._loadingPortal.getActive() ||
          this.ionicApp._modalPortal.getActive() ||
          this.ionicApp._toastPortal.getActive() ||
          this.ionicApp._overlayPortal.getActive();

      if (activePortal) {

        activePortal.dismiss({animate: false});

        // Logger.log("handled with portal");
        return;
      }

      if (this.menuCtrl.isOpen()) {
        this.menuCtrl.close();

        // Logger.log("closing menu");
        return;
      }

      const view = this.nav.getActive();
      const page = view ? this.nav.getActive().instance : undefined;

      if (page && !this.nav.canGoBack() && page.isHome !== undefined && page.isHome) {
        // Minimize app, that it don't need to start again.
        this.appMinimize.minimize();
        // old window['plugins'].appMinimize.minimize();

      } else if (page && !this.nav.canGoBack()) {
        // isn'T realy root.
        // this.__unregisterBack();
        this.nav.setRoot(this.ROOT_PAGE);
      } else if (this.nav.canGoBack() || view && view.isOverlay) {

        this.nav.pop({animate: false});
      }
    }, 1);

  }*/
}

