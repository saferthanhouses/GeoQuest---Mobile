'use strict';

app.directive('navbar', function ($rootScope, $state, ClickFactory, $timeout, $ionicModal, AuthService, Session) {  // other injections: , AuthService, AUTH_EVENTS, 

    return {
        transclude: true,
        restrict: 'E',
        scope: {
            home: '=',
            abandon: '=',
            nssocket: '=',
            socket: '=',
            user: '=',
            startedquests: '=',
            transitionstate: '='
        },
        templateUrl: 'templates/navbar.html',
        link: function (scope) {

            $('button').click(function() {
              var theButton = $(this);
              ClickFactory.buttonReact(theButton);
            });

            scope.openAuth = function() {
                $rootScope.$emit('openAuthModal');
            }

            $rootScope.$on('auth-login-success', function() {
                scope.user = Session.user;
            })

            $rootScope.$on('auth-logout-success-', function(){
                scope.user = false;
            })

            scope.logout = function() {
                AuthService.logout().then(function(){
                    $rootScope.$broadcast('logout');
                });
            } ;

        }

    };

});
