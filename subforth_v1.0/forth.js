let instructions = [];
let stack = [];
const memory = Array(1).fill(0);
for (let i=-32768; i<=32767; i++) memory[i] = 0;
memory[-2] = 1;

let quit = true;

function quit_process() {
  output.innerText += '\n';
  quit = true; input.disabled = false;
  input.focus(); update_caret();
  return true;
};

document.addEventListener('keyup', () => { memory[-3] = 0; });
document.addEventListener('keydown', () => {
  if (event.ctrlKey && event.key == "c") return quit = true;
  memory[-3] = event.key.charCodeAt(0);
});

input.addEventListener('keydown', () => {
  if (event.key == 'Enter' && !event.shiftKey) {
    quit = false; input.disabled = true;
    output.innerText += input.value + ' ';
    const input_string = input.value;
    input.value = ''; event.preventDefault();
    interpret(input_string);
  };
});

function interpret(input_string) {
  instructions = input_string.split(/\s+/).filter(str => str != "");
  memory[-1] = 0;
  thread_input();
};

function thread_input() {
  for (let i=0; i<memory[-2]; i++) if (program_loop()) return;
  window.scrollTo(0, document.body.scrollHeight);
  requestAnimationFrame(thread_input);
};

function program_loop() {
//  console.log(`${instructions.at(memory[-1])} ; ${memory[-1]} ; ${stack.join(', ')}`);
//  if (!quit && memory[-1] >= instructions.length) output.innerText += ' OK';
  if (quit || memory[-1] >= instructions.length) return quit_process();
  read_input_at(memory[-1]);
  memory[-1]++;
};

function read_input_at(program_counter) {
  const word = instructions.at(program_counter).toUpperCase();
  if (is_defined(word)) return exec_defined(word);
  if (is_core(word))    return exec_core(word);
  if (is_io(word))      return exec_io(word);
  if (is_number(word))  return exec_number(word);
  not_word(word);
};

function not_word(word) {
  output.innerText += `UNDEFINED WORD >>>${word}<<<`;
  stack = []; quit = true;
};

function syntax_error() {
  output.innerText += `SYNTAX ERROR`;
  stack = []; quit = true;
};

function is_defined(word) { return defined_words.some(object => object.name == word); };
function is_core(word)    { return core_words.some(object => object.name == word); };
function is_io(word)      { return io_words.some(object => object.name == word); };
function is_number(word)  { return /^-?\d+$/.test(word); };

function exec_defined(word) {
  const index = defined_words.findIndex(object => object.name == word);
  instructions.splice(memory[-1], 1, 'NOP', ...defined_words.at(index).inst);
};

function exec_core(word) {
  const index = core_words.findIndex(object => object.name == word);
  core_words.at(index).exec();
};

function exec_io(word) {
  const index = io_words.findIndex(object => object.name == word);
  io_words.at(index).exec();
};

function exec_number(word) {
  stack.push(enforce_16bit(+word));
};

function enforce_16bit(n) {
  return (n << 16) >> 16;
};

const defined_words = [];
const core_words = [{
    name: 'NOP', // ( -- ) do nothing
    exec: function () {}
  }, {
    name: '!', // ( n addr -- ) store
    exec: function() {
      const [addr, n] = [stack.pop(), stack.pop()];
      memory[addr] = n;
    }
  }, {
    name: '?', // ( addr -- n ) fetch
    exec: function() {
      const addr = stack.pop();
      stack.push(memory[addr]);
    }
  }, {
    name: '-', // ( a b -- a-b ) subtract
    exec: function() {
      stack.push(enforce_16bit(-stack.pop() + stack.pop()));
    }
  }, {
    name: 'IF', // ( f -- ) conditional statement
    exec: function() { 
      if (stack.pop() > 0) {
        while (instructions.at(memory[-1]).toUpperCase() != 'THEN') {
          if (memory[-1] >= instructions.length) return syntax_error();
          memory[-1]++;
        };
      };
    }
  }, {
    name: 'THEN', // ( -- ) closing if-tag
    exec: function() {}
  }, {
    name: ':', // compile word/macro
    exec: function() {
      memory[-1]++;
      if (memory[-1] >= instructions.length) return syntax_error();
      const [name, inst] = [instructions.at(memory[-1]).toUpperCase(), []];
      memory[-1]++;
      while (instructions.at(memory[-1]) != ';') {
        if (memory[-1] >= instructions.length) return syntax_error();
        inst.push(instructions.at(memory[-1]));
        memory[-1]++;
      };
      const index = defined_words.findIndex(object => object.name == name);
      if (index != -1) defined_words.splice(index, 1);
      defined_words.push({ name: name, inst: inst });
    }
  }, {
    name: '(', // comment
    exec: function () {
      while (instructions.at(memory[-1]) != ')') {
        if (memory[-1] >= instructions.length) return syntax_error();
        memory[-1]++;
      };
    }
}];

const io_words = [{
    name: 'PRINT', // ( n -- ) print n as decimal
    exec: function() {
      output.innerText += stack.pop();
    }
  }, {
    name: 'EMIT', // ( n -- ) print n as character
    exec: function() {
      output.innerText += String.fromCharCode(stack.pop());
    }
  }, {
    name: 'PAGE', // ( -- ) clear output
    exec: function() {
      output.innerText = '';
    }
  }, {
    name: 'STACK', // ( -- ) print stack
    exec: function() {
      output.innerText += `<${stack.length}> ${stack.join(', ')}`;
    }
  }, {
    name: 'PRINT"', // print following string, closed by '"'
    exec: function () {
      memory[-1]++;
      const string = [];
      while (instructions.at(memory[-1]) != '"') {
        if (memory[-1] >= instructions.length) return syntax_error();
        string.push(instructions.at(memory[-1]));
        memory[-1]++;
      };
      output.innerText += string.join(' ');
    }
  }, {
    name: 'WORDS', // print all defined words
    exec: function() {
      defined_words.forEach(object => output.innerText += object.name + ' ');
    }
  }, {
    name: 'SEE', // print word definition
    exec: function() {
      memory[-1]++;
      if (memory[-1] >= instructions.length) return syntax_error();
      const name = instructions.at(memory[-1]).toUpperCase();
      const index = defined_words.findIndex(object => object.name == name);
      if (index != -1) return output.innerText +=
        `: ${name} ${defined_words.at(index).inst.join(' ').toUpperCase()} ;`;
      output.innerText += `UNKNOWN WORD >>>${name}<<<`;
    }
}];

// LOAD SUBFORTH EXTENSION
fetch('main.fs')
  .then(response => response.text())
  .then(data => { load(data); })
  .catch(error => { console.error('Error loading file:', error); });

function load(data) {
  quit = false; input.disabled = true;
  interpret(data);
};
