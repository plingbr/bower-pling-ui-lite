(function (context) {
    'use strict';

    context.pling = {};

}(window));

(function () {
    'use strict';

    angular
        .module('plingUiLite', []);

    angular
        .module('plingUiLite')
        .config(['$provide', '$httpProvider', PlingUiConfig]);

    angular
        .module('plingUiLite')
        .run([ 'boot.options', '$injector', PlingUiRun ]);

    function PlingUiConfig($provide, $httpProvider) {
        $provide.decorator('$log', function ($delegate, shadowLogger) {
            return shadowLogger($delegate);
        });

        // Interceptor that add token in each Header Request
        $httpProvider.interceptors.push('plingRequestInterceptor');
    }

    function PlingUiRun(options, $injector) {
        var cache = null;

        if (options.onRun && options.onRun.cacheViews) {
            cache = $injector.get('cacheService');
            cache.cacheViews();
        }
    }
}());

(function() {

    'use strict';

    angular
        .module('plingUiLite')
        .service('applicationsService', ApplicationsService);

    ApplicationsService.$inject = [ '$window', '$localstorage', 'httpService', 'tokenService' ];

    function ApplicationsService($window, $localstorage, httpService, tokenService) {

        this.getLocal = function() {
            var localAppData = $localstorage.get('PLING-APPS');

            localAppData = localAppData ? JSON.parse(localAppData) : {};
            return localAppData;
        };

        this.getCurrentAppModule = function() {
            var currentAppModule = $localstorage.get('PLING-CURRENT-APP');

            return currentAppModule;
        };

        this.getCurrentApp = function() {
            var currentApp = {
                'appModule': $localstorage.get('PLING-CURRENT-APP'),
                'env': $localstorage.get('PLING-CURRENT-ENV')
            };

            return currentApp;
        };

        this.getCallbackUrl = function(appId, cb) {
            httpService.post('accounts', '_oauth', { 'appid': appId })
                .success(function (data) {
                    if (data.callbackUrl) {
                        cb(null, data.callbackUrl + '?token=' + tokenService.get());
                    } else {
                        cb('Callback url not found');
                    }
                })
                .error(function (reason) {
                    cb(reason || 'Server Unavailable', null);
                });
        };

        this.redirect = function(url) {
            $window.location.href = url;
        };

    }

}());
(function () {
    'use strict';

    CardValidatorService.$inject = [ ];

    angular.module('plingUiLite').service('cardValidatorService', CardValidatorService);

    function CardValidatorService() {
        var types = [];

        types.push({
            'niceType' : 'Visa',
            'type' : 1,
            'prefixPattern' : /^4$/,
            'exactPattern' : /^4\d*$/,
            'gaps' : [4, 8, 12],
            'lengths' : [16],
            'code' : {
                'name' : 'CVV',
                'size' : 3
            }
        });

        types.push({
            'niceType' : 'MasterCard',
            'type' : 2,
            'prefixPattern' : /^(5|5[1-5]|2|22|222|222[1-9]|2[3-6]|27[0-1]|2720)$/,
            'exactPattern' : /^(5[1-5]|222[1-9]|2[3-6]|27[0-1]|2720)\d*$/,
            'gaps' : [4, 8, 12],
            'lengths' : [16],
            'code' : {
                'name' : 'CVV',
                'size' : 3
            }
        });

        function luhn10(identifier) {
            var sum = 0;
            var alt = false;
            var i = identifier.length - 1;
            var num;

            while (i >= 0) {
                num = parseInt(identifier.charAt(i), 10);

                if (alt) {
                    num *= 2;
                    if (num > 9) {
                        num = (num % 10) + 1; // eslint-disable-line no-extra-parens
                    }
                }

                alt = !alt;

                sum += num;

                i--;
            }

            return sum % 10 === 0;
        }

        function validateDate (date) {
            var now = new Date();
            var month = parseInt(date.substr(0, 2), 10) - 1;
            var year = parseInt(date.substr(2, 2), 10) + 2000;

            if (month < 0 || month > 11 || year - now.getFullYear() > 15)
                return false;

            return new Date(year, month, 1).getTime() > now.getTime();
        }

        this.getValidYears = function() {
            var i;
            var nowYear = new Date().getFullYear();
            var validYears = [];

            for (i = nowYear; i <= nowYear + 15; i++)
                validYears.push(i);

            return validYears;
        };

        this.validate = function (cardNumber, dateExpiration, cvv) {
            var number, numberResult, dateResult, i, validType;

            if (!cardNumber)
                return {
                    'isValid' : false,
                    'type'    : null
                };

            number = cardNumber.toString();

            for (i=0; i<types.length; i++) {
                if (types[i].exactPattern.test(number)) {
                    validType = types[i];
                    break;
                }
            }

            if (!validType)
                return {
                    'isValid' : false,
                    'type'    : null
                };

            numberResult = luhn10(number);
            dateResult = validateDate(dateExpiration);

            return {
                'isValid' : numberResult && dateResult && cvv.length >= 3,
                'type'    : validType
            };
        };

        this.validateDate = function (dateExpiration) {
            var dateResult;

            dateResult = validateDate(dateExpiration);

            return {
                'isValid' : dateResult
            };
        };

        this.validateCardNumber = function (cardNumber) {
            var number, numberResult, i, validType;

            if (!cardNumber)
                return {
                    'isValid'  : false,
                    'type'     : null
                };

            number = cardNumber.toString();

            for (i=0; i<types.length; i++) {
                if (types[i].exactPattern.test(number)) {
                    validType = types[i];
                    break;
                }
            }

            if (!validType)
                return {
                    'isValid' : false,
                    'type'    : null
                };

            numberResult = luhn10(number);

            return {
                'isValid' : numberResult,
                'type'    : validType
            };
        };
    }

})();
(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('cepService', CepService);

    CepService.$inject = [ 'httpService' ];

    function CepService(httpService) {

        this.getCep = function (cep) {
            return httpService.get('smart', 'cep', cep);
        };
    }

}());
(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('coreApiService', CoreApiService);

    CoreApiService.$inject = [ 'boot.options', '$window', '$rootScope', '$http' ];

    function CoreApiService(options, $window, $rootScope, $http) {

        var self = this;

        /*
        *  url do core obtido do conf.json da aplicacao corrente concatenado com parametros
        * @param {string} nome da aplicacao. ex: 'accounts', 'drive', 'integra'
        * @param {string} nome do modulo. ex: 'contactPreferences', 'users/list'.
        * @returns {string} concatenacao da url do core com parametros.
        */
        this.getAppCoreUrl = function (app, module) {
            var url;

            url = options.core_url + options.def_api_version;

            url += app ? '/' + app : '';
            url += module ? '/' + module : '';

            return url;
        };

        // Returns Application name capitalizing the first letter with UpperCase
        this.getApplicationName = function () {
            return options.def_api_app.charAt(0).toUpperCase() + options.def_api_app.slice(1);
        };

        this.redirectToLoginWithCallback = function(callbackUrl) {
            var callbackQueryString;

            $rootScope.$emit('PLING-SERVICE-BAR-ISLOADING', true);

            // Seta callback url
            callbackQueryString = callbackUrl ? '?callbackurl=' + callbackUrl : '';

            // Busca a URL do login por ambiente (conf.json)
            $http.get(self.getAppCoreUrl('accounts', 'products/Login/' + options.environment))
                .success(function(data) {
                    if (data)
                        $window.location.href = data.callbackUrl + callbackQueryString;
                })
                .error(function() {
                    console.log('Erro ao obter URL para aplicação de Login'); // eslint-disable-line
                    $rootScope.$emit('PLING-SERVICE-BAR-ISLOADING', false);
                    return false;
                });
        };

        this.redirectToControlPanel = function() {
            $rootScope.$emit('PLING-SERVICE-BAR-ISLOADING', true);

            $http.get(self.getAppCoreUrl('accounts', 'products/Painel/' + options.environment))
                .success(function(data) {
                    if (data)
                        $window.location.href = data.callbackUrl;
                })
                .error(function() {
                    console.log('Erro ao obter URL para Minha Conta'); // eslint-disable-line
                    $rootScope.$emit('PLING-SERVICE-BAR-ISLOADING', false);
                    return false;
                });
        };

        this.getSocialMedia = function() {
            return {
                'facebook' : options.facebook,
                'twitter'  : options.twitter
            };
        };

        this.getCurrentBusiness =  function () {
            return options.current_business || 'psicologia';
        };
    }

}());
(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('credentialsService', CredentialsService);

    CredentialsService.$inject = [ 'httpService', '$localstorage', 'coreApiService', '$q' ];

    function CredentialsService(httpService, $localstorage, core, $q) {

        function getCredential(cb) {
            httpService.get('accounts', 'me')
                .success(function(data) {
                    $localstorage.setObject('PLING-USER', data);
                    return cb(null, data);
                })
                .error(function(reason) {
                    console.log(reason); // eslint-disable-line
                    return cb(reason);
                });
        }

        this.logout = function () {
            // Consumir o Core para o token entrar em Blacklist
            httpService.post('accounts', 'logout')
                .success(function() {
                    $localstorage.clearAll();
                    core.redirectToLoginWithCallback();
                })
                .error(function(reason) {
                    console.log(reason); // eslint-disable-line no-console
                });
        };

        this.login = function(credential) {
            var deferred = $q.defer();

            httpService.post('accounts', 'login', credential)
                .success(function(loginData) {
                    $localstorage.set('PLING-TOKEN', loginData.token);

                    getCredential(function(err, credential) {
                        if (err)
                            return deferred.reject(err);

                        return deferred.resolve(null, credential);
                    });
                })
                .error(function(reason) {
                    console.log(reason); // eslint-disable-line
                    return deferred.reject(reason);
                });

            return deferred.promise;
        };

        this.getLocal = function () {
            var userData = $localstorage.get('PLING-USER');

            if (!userData) return null;

            userData = JSON.parse(userData);
            return userData;
        };

    }

}());
(function() {
    'use strict';

    CustomersService.$inject = ['$localstorage', 'httpService', '$q'];

    angular.module('plingUiLite').service('customersService', CustomersService);

    function CustomersService($localstorage, httpService, $q) {

        this.createCustomer = function(customer) {
            var deferred = $q.defer();
            var env = $localstorage.get('PLING-CURRENT-ENV');

            httpService.post('accounts', 'customers/admin/' + env, customer)
                .success(function(customerData) {
                    deferred.resolve(customerData);
                })
                .error(function(reason) {
                    console.log(reason); // eslint-disable-line
                    deferred.reject(reason);
                });

            return deferred.promise;
        };

        this.updateCustomer = function(customer) {
            var deferred = $q.defer();

            httpService.put('accounts', 'customers', customer)
                .success(function(data) {
                    deferred.resolve(data);
                })
                .error(function(reason) {
                    console.log(reason); // eslint-disable-line
                    deferred.reject(reason);
                });

            return deferred.promise;
        };

        this.getCustomer = function(customerId) {
            var deferred = $q.defer();

            httpService.get('accounts', 'customers', customerId)
                .success(function(data) {
                    deferred.resolve(data);
                })
                .error(function(reason) {
                    deferred.reject(reason);
                });

            return deferred.promise;
        };
    }

}());
(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('httpHelperService', HttpHelperService);

    HttpHelperService.$inject = [ '$http', 'coreApiService', '$q' ];

    function HttpHelperService($http, core, $q) {

        var groups = {};

        this.registerUrl = function (url, groupName) {
            var defer;

            if (!groupName)
                groupName = 'default';

            if (!groups[groupName]) {
                defer = $q.defer();
                groups[groupName] = defer;
            } else
                defer = groups[groupName];

            return defer.promise;
        };

        this.cancelRequest = function (groupName) {
            if (!groupName)
                groupName = 'default';

            groups[groupName].resolve('cancelled');
            delete groups[groupName];
        };
    }

}());
(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('httpService', HttpService);

    HttpService.$inject = [ '$http', 'coreApiService', 'httpHelperService' ];

    function HttpService($http, core) {

        this.save = function (app, module, data) {
            return $http.post(core.getAppCoreUrl(app, module), data);
        };

        this.update = function (app, module, data) {
            return $http.put(core.getAppCoreUrl(app, module), data);
        };

        this.upload = function (app, module, file) {
            return $http
               .post(core.getAppCoreUrl(app, module), file, {
                   'transformRequest' : angular.identity,
                   'headers'          : { 'Content-Type': undefined }  // eslint-disable-line
               });
        };

        this.get = function (app, module, id) {
            var url = core.getAppCoreUrl(app, module),
                type;

            if (id) {
                url += '/' + id;
            } else if (module.indexOf('public') > 0) {
                type = {
                    'responseType': 'arraybuffer'
                };
            }
            return $http.get(url, type);
        };

        this.getImage = function (url, cb) {
            this.get('credentials/public?imagepath=' + url)
                .success(function (imageDownloadData) {
                    var blob   = new Blob([ imageDownloadData ], { 'type': 'image/jpeg' }),
                        reader = new FileReader();

                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        cb(null, reader.result);
                    };
                    // cb(null, objectUrl);
                })
                .error(function (err) {
                    cb(err);
                });
        };

        this.post = function (app, module, data) {
            var req = {
                'method'  : 'POST',
                'url'     : core.getAppCoreUrl(app, module),
                'headers' : {
                    'Content-Type': 'application/json'
                },
                'data': data
            };

            return $http(req);
        };

        this.put = function (app, module, data) {
            var req = {
                'method'  : 'PUT',
                'url'     : core.getAppCoreUrl(app, module),
                'headers' : {
                    'Content-Type': 'application/json'
                },
                'data': data
            };

            return $http(req);
        };

        this.delete = function (app, module, id) {
            var req = {
                'method'  : 'DELETE',
                'url'     : core.getAppCoreUrl(app, module) + '/' + id,
                'headers' : {
                    'Content-Type': 'application/json'
                }
            };

            return $http(req);
        };

    }

}());

(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('tokenService', TokenService);

    TokenService.$inject = [ '$http', '$localstorage', 'coreApiService' ];

    function TokenService($http, $localstorage, coreApiService) {

        this.get = function() {
            return $localstorage.get('PLING-TOKEN');
        };

        this.set = function(token) {
            if (token) {
                $localstorage.set('PLING-TOKEN', token);
                return true;
            }

            return false;
        };

        this.validate = function (cb) {
            $http.get(coreApiService.getAppCoreUrl('accounts', 'me'))
                .success(function(credentialData) {
                    cb(null, credentialData);
                })
                .error(function(reason) {
                    cb(reason);
                });
        };

    }

}());
(function (context, logger) {
    'use strict';

    // creating namespace
    function Bootstrapper() {
        this.isBootstrapped = false;
    }

    // boot a module
    Bootstrapper.prototype.Angular = function (root, appname, source, cb) {
        var self = this;

        window.localStorage.setItem('PLING-CURRENT-APP', appname);

        // loading file
        context.loader.load(source, function (err, options) {

            options.core_url = options.environment === 'local' ? options.local_core_url || options.core_url : options.core_url;

            var // eslint-disable-line
                token         = window.localStorage['PLING-TOKEN'],
                queryString   = window.localStorage['PLING-QUERY-STRING'] || window.location.search,
                coreUrl       = options.core_url,
                environment   = options.environment,
                defApiVersion = options.def_api_version,
                initInjector  = angular.injector(['ng']),
                $http         = initInjector.get('$http'),
                currentUrl    = window.location.href,
                localCallbackUrl;

            window.localStorage.setItem('PLING-CURRENT-ENV', environment);

            // checking errors...
            if (err) {
                logger.warn('Arquivo de configuracao nao encontrado!');
                logger.debug(err);

                return false;
            }

            // No authentication
            if ('auth' in options && options.auth === false) {
                if (!token) {
                    // saving boot settings
                    angular.module(appname).value('boot.options', options); // eslint-disable-line

                    // starting app
                    angular.bootstrap(root, [appname]);
                    self.isBootstrapped = true;

                    // calling callback
                    if (cb) cb();
                }
                else {
                    $http
                    .get(coreUrl + defApiVersion + '/accounts/me' + '?appmodule=' + appname + '&environment=' + environment, {
                        'headers': { 'Authorization': token }
                    })
                    .success(function(credentialData) {
                        window.localStorage.setItem('PLING-APPS', JSON.stringify(credentialData.profilesProducts));

                        delete credentialData.profilesProducts;
                        delete credentialData.iat;
                        delete credentialData.exp;

                        window.localStorage.setItem('PLING-USER', JSON.stringify(credentialData));

                        // saving boot settings
                        angular.module(appname).value('boot.options', options); // eslint-disable-line

                        // starting app
                        angular.bootstrap(root, [appname]);
                        self.isBootstrapped = true;

                        // calling callback
                        if (cb) cb();
                    })
                    .error(function(reason) {
                        logger.error(reason);
                        window.localStorage.clear();
                        window.localStorage.setItem('PLING-CURRENT-APP', appname);
                        window.localStorage.setItem('PLING-CURRENT-ENV', environment);
                        // saving boot settings
                        angular.module(appname).value('boot.options', options); // eslint-disable-line
                        // starting app
                        angular.bootstrap(root, [appname]);
                        self.isBootstrapped = true;
                    });
                }

                return false;
            }

            // checking for the token
            if (!token && queryString.indexOf('token=') === 1) {
                window.localStorage.setItem('PLING-TOKEN', queryString.split('=')[1]);
            }

            // if there's no token it must redirect to login
            if (!token && coreUrl) {
                window.localStorage.clear();
                localCallbackUrl = currentUrl ? '?callbackurl=' + currentUrl : '';
                $http
                    .get(coreUrl + defApiVersion + '/accounts/products/Login/' + environment)
                    .success(function(urlData) {
                        window.location.href = urlData.callbackUrl + localCallbackUrl;
                        return false;
                    })
                    .error(function(reason) {
                        logger.error(reason);
                        return false;
                    });
            }

            // else it must validate it and then start the application
            else {
                $http
                    .get(coreUrl + defApiVersion + '/accounts/me' + '?appmodule=' + appname + '&environment=' + environment, {
                        'headers': { 'Authorization': token }
                    })
                    .success(function(credentialData) {

                        window.localStorage.setItem('PLING-APPS', JSON.stringify(credentialData.profilesProducts));

                        if (credentialData.modules) {
                            window.localStorage.setItem('PLING-MODULES', JSON.stringify(credentialData.modules));

                            pling.loader.settings.menu    = []; // eslint-disable-line
                            pling.loader.settings.submenu = []; // eslint-disable-line

                            credentialData.modules.forEach(function(module) {
                                if (module.config.isSubMenu) {
                                    pling.loader.settings.submenu.push(module); // eslint-disable-line
                                } else if (module.config.isMenu && !module.config.isSubMenu) {
                                    pling.loader.settings.menu.push(module);    // eslint-disable-line
                                }
                            });
                        }

                        if (credentialData.viewPreferences)
                            window.localStorage.setItem('PLING-CURRENT-VIEW-PREFERENCES', JSON.stringify(credentialData.viewPreferences));

                        delete credentialData.profilesProducts;
                        delete credentialData.iat;
                        delete credentialData.exp;

                        window.localStorage.setItem('PLING-USER', JSON.stringify(credentialData));

                        // saving boot settings
                        angular.module(appname).value('boot.options', options); // eslint-disable-line

                        // starting app
                        angular.bootstrap(root, [appname]);
                        self.isBootstrapped = true;

                        // calling callback
                        if (cb) cb();
                    })
                    .error(function(reason) {
                        logger.error(reason);
                        window.localStorage.clear();
                        localCallbackUrl = currentUrl ? '?callbackurl=' + currentUrl : '';
                        $http
                            .get(coreUrl + defApiVersion + '/accounts/Login/' + environment)
                            .success(function(urlData) {
                                window.location.href = urlData.callbackUrl + localCallbackUrl;
                                return false;
                            })
                            .error(function(reason) {
                                logger.error(reason);
                                return false;
                            });
                    });
            }
        });
    };

    // creating instance
    context.boot = new Bootstrapper();

}(window.pling, window.console));
(function (dom, logger, context) {
    'use strict';

    // Content Loaded listener
    function onDOMLoaded() {

        // detect angular application 'directive'
        var root,
            directive = 'plg-app',
            source    = 'src',
            filter    = '[' + directive + ']';

        // retrieving root element
        root = dom.querySelector(filter);

        // working on root
        if (root) {

            // retrieving app name
            context.name   = root.getAttribute(directive);
            context.source = root.getAttribute(source) || 'pling.conf.json';

            // loading config file
            logger.info('AngularJS 1.5.x spa check:', true);
            context.boot.Angular(root, context.name, context.source, function (err) {

                if (err) logger.error('Could not boot app ', context.name);
                else logger.info('Bootstrapped:', context.boot.isBootstrapped);

            });

        } else {
            logger.info('AngularJS 1.5.x spa check:', false);
        }
    }

    dom.addEventListener('DOMContentLoaded', onDOMLoaded);

}(document, window.console, window.pling));
(function (context) {
    'use strict';

    // creating namespace
    function ConfLoader() {
        this.settings = null;
    }

    // loading file
    ConfLoader.prototype.load = function (filepath, cb) {
        var self = this,
            parsed,
            xhr = new XMLHttpRequest(); // eslint-disable-line

        // sending result
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {

                    parsed = JSON.parse(xhr.responseText);
                    self.settings = parsed;

                    cb(null, parsed);
                } else {
                    cb('Error loading file - status ' + xhr.status, {});
                }
            }
        };

        // handling error
        xhr.onerror = function (err) {
            cb(err);
        };

        // fetching file
        xhr.open('GET', filepath, true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.send();
    };

    // creating instance
    context.loader = new ConfLoader();
}(window.pling));
(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('cacheService', CachingService);

    CachingService.$inject = [ '$templateCache', '$route', '$http' ];

    function CachingService($templateCache, $route, $http) {


        this.cacheViews = function (cacheObj, routeObj) {

            // setting defaults
            var
                partial, route,
                viewCache = cacheObj || $templateCache,
                router = routeObj || $route;

            // looping routes
            for (route in router.routes) {

                if (router.routes.hasOwnProperty(route)) {

                    // evaluate partial
                    partial = router.routes[route].templateUrl;

                    if (partial)
                        // caching route
                        $http.get(partial, {'cache': viewCache});
                }
            }
        };
    }

}());

(function() {
    'use strict';

    angular
        .module('plingUiLite')
        .service('$localstorage', $LocalStorage);

    $LocalStorage.$inject = [ '$window' ];

    function $LocalStorage($window) {
        return {

            'clearAll': function () {
                $window.localStorage.clear();
            },

            'set': function (key, value) {
                $window.localStorage[key] = value;
            },

            'get': function (key) {
                return $window.localStorage[key];
            },

            'setObject': function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },

            'getObject': function (key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        };
    }

}());
(function () {
    'use strict';

    angular
        .module('plingUiLite')
        .service('sessionstorage', $SessionStorage);

    $SessionStorage.$inject = [ '$window' ];

    function $SessionStorage($window) {
        return {

            'clearAll': function () {
                $window.localStorage.clear();
            },

            'set': function (key, value) {
                $window.localStorage[key] = value;
            },

            'get': function (key) {
                return $window.localStorage[key];
            },

            'setObject': function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },

            'getObject': function (key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        };
    }

}());
(function () {
    'use strict';

    angular
        .module('plingUiLite')
        .factory('plingRequestInterceptor', PlingRequestInterceptor);

    PlingRequestInterceptor.$inject = [ '$q', '$window' ];

    function PlingRequestInterceptor($q, $window) {

        return {

            // On request
            'request': function (config) {
                var isAuth = $window.localStorage.getItem('PLING-TOKEN');

                // Add Token info to every request
                if (isAuth !== false)
                    config.headers.Authorization = $window.localStorage.getItem('PLING-TOKEN');

                return config;
            },

            // On request error
            'requestError': function (reason) {

                // Return the promise error reason.
                return $q.reject(reason);
            },

            // On response success
            'response': function (response) {

                // Return the response or promise.
                return response || $q.when(response);
            },

            // On response error
            'responseError': function (reason) {

                // Return the promise error reason.
                return $q.reject(reason);
            }

        };
    }

}(document, window.console, window.pling));
(function () {
    'use strict';

    angular
        .module('plingUiLite')
        .factory('$exceptionHandler', PlingUiExceptionHandler);

    PlingUiExceptionHandler.$inject = ['$injector'];

    function PlingUiExceptionHandler($injector) {

        return function (exception, cause) {

            // preparing message to be dispatched
            var dispatcher = null,
                logger = null,
                data = {
                    'error': exception,
                    'details': cause
                };

            // logging
            logger = $injector.get('$log');
            logger.error(exception);

            if (cause) {
                logger.debug(cause);
            }

            // dispatching message
            dispatcher = $injector.get('$rootScope');
            dispatcher.$broadcast('PLINGUI_INTERNAL_ERROR', data);
        };
    }

}());
(function () {
    'use strict';

    angular
        .module('plingUiLite')
        .factory('shadowLogger', PlingUiLogger);

    function PlingUiLogger() {

        return function ($delegate) {

            return {

                'log': function () {
                    this.dispatch('log', arguments);
                },

                'info': function () {
                    this.dispatch('info', arguments);
                },

                'error': function () {
                    this.dispatch('error', arguments);
                },

                'warn': function () {
                    this.dispatch('warn', arguments);
                },

                'dispatch': function (method, params) {
                    // defining method
                    var proc = $delegate[method] || $delegate.log,
                        stamp = new Date().toString(),
                        prefix = '[' + stamp + '][' + method + ']::',
                        msg = [],
                        arg;

                    if (method) {
                        // preparing msg
                        msg.push(prefix);

                        // joining params
                        for (arg in params) {
                            if (params.hasOwnProperty(arg)) {
                                msg.push(params[arg]);
                            }
                        }

                        // applying log info
                        proc.apply(null, msg);
                    }
                }
            };
        };
    }
}());