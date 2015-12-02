app.service('AuthModal', function($ionicModal, AuthService, $rootScope){
	
	// this modal should be opened at various points throughout the application in response
	// to an event.
	// Qs:
	// Will this work in a service?
	// Where to attach the modal to? The service itself? The $rootScope?

	self = this;

	$ionicModal.fromTemplateUrl('/templates/auth-modal.html', {
    	scope: $rootScope,
    	animation: 'slide-in-up'
  	}).then(function(modal) {
    	self.modal = modal;
  	});

	$rootScope.$on('openAuthModal', function() {
		self.modal.show();
	});

	$rootScope.login = function(userInfo) {
		AuthService.login(userInfo).then(function(user){
			self.modal.hide()
		}, function(){
			$rootScope.validationError = true;
		})
	}

	$rootScope.signup = function(userInfo) {
		AuthService.signup(userInfo).then(function(user){
			self.modal.hide()
		}, function(){
			$rootScope.validationError = true;
		})
	}
})