const parrot = require('./parrot');

console.log('Intent Schema:');
console.log();
console.log(parrot.schemas.skillBuilder());
console.log('Utterances');
console.log(parrot.utterances());