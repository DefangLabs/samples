module.exports.routes = {
  '/': {
    controller: 'HelloController',
    action: 'sayHello'
  },
  '/hello': 'HelloController.sayHello'
};
