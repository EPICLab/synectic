// const add = require('./lib/add.js');
// const Incr = require('./lib/MyClass.js');
// const inst = new Incr();
//
// console.log(add(4, 5));
//
// console.log(inst);

// inst.printCounter();
// inst.incCounter();
// inst.printCounter();

var Person = require('./lib/person.js');

var someone = new Person('Nicholas', 'Nelson');
someone.display();
