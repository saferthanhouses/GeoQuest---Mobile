app.service('AuthModal', function($ionicModal, AuthService, ClickFactory, $rootScope, $timeout){
	
	// this modal should be opened at various points throughout the application in response
	// to an event.
	// Qs:
	// Will this work in a service?
	// Where to attach the modal to? The service itself? The $rootScope?

	self = this;

	$ionicModal.fromTemplateUrl('templates/auth-modal.html', {
    	scope: $rootScope,
    	animation: 'slide-in-up'
  	}).then(function(modal) {
    	self.modal = modal;
  	});

	$rootScope.$on('openAuthModal', function() {
		self.modal.show();
	});

	$rootScope.login = function(userInfo) {
		$rootScope.userInfo = {};
		AuthService.login(userInfo).then(function(user){
			self.modal.hide()
		}, function() {
			$rootScope.validationError = true;
			$timeout(function(){
				$rootScope.validationError = false;
			}, 2000);
		});
	};

	$rootScope.signup = function(userInfo) {
		$rootScope.userInfo = {};
		AuthService.signup(userInfo).then(function(user){
			self.modal.hide()
		}, function() {
			$rootScope.validationError = true;
			$timeout(function(){
				$rootScope.validationError = false;
			}, 2000);
		});
	};

	$('button').click(function() {
      var theButton = $(this);
      ClickFactory.buttonReact(theButton);
    });

});


