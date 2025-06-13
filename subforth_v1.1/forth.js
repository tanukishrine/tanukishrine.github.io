// ..####...##..##..#####...######...####...#####...######..##..##.
// .##......##..##..##..##..##......##..##..##..##....##....##..##.
// ..####...##..##..#####...####....##..##..#####.....##....######.
// .....##..##..##..##..##..##......##..##..##..##....##....##..##.
// ..####....####...#####...##.......####...##..##....##....##..##.
// ................................................................

// SUBFORTH v1.1 | OPEN SOURCE 2025 BY T.SZULC

// RETURN ~~ STACK ~~ MEMORY
// -2: TICK RATE
// -1: PROGRAM COUNTER

let stack = [];
let return_stack = [];
let memory = Array(32768).fill(0);
let instr = '';

let quit = true;
function quit_process() {
  quit = true;
  input.disabled = false;
  input.focus();
  update_caret();
  output.innerText += '\n';
  return true;
};

document.addEventListener('keydown', () => {
  if (event.ctrlKey && event.key == "c") error('');
  if (event.key == 'Enter' && !event.shiftKey) process_input();
});

function process_input() {
  const input_string = input.value + ' ';
  input.value = '';
  event.preventDefault();
  quit = false;
  input.disabled = true;
  output.innerText += input_string;
  memory[-1] = instr.length;
  instr += input_string;
  thread_input();
};

memory[-2] = 1; // default tick rate
function thread_input() {
  for (let i=0; i<memory[-2]; i++) if (program_loop()) return;
  window.scrollTo(0, document.body.scrollHeight);
  requestAnimationFrame(thread_input);
};

function program_loop() {
  if (quit || memory[-1] >= instr.length) return quit_process();
  read_token(tokenize());
};

function tokenize() {
  let token = '';
  while (is_space()) memory[-1]++;
  if (memory[-1] >= instr.length) return 'nop';
  while (!is_space()) {
    token += instr.charAt(memory[-1]++);
  };
  return token;
};

function is_space() { // refactor...
  return /\s/.test(instr.charAt(memory[-1]));
};

function read_token(token) {
  if (macro(token))   return;
  if (core(token))    return;
  if (io(token))      return;
  if (number(token))  return;
  error(`\nUndefined word\n>>>${token}<<< `);
};

function macro(token) {
  const index = macro_words.findIndex(obj => obj.name == token);
  if (index > -1) {
    return_stack.push(memory[-1]);
    memory[-1] = macro_words.at(index).pointer;
    return true;
  };
};

function core(token) {
  const index = core_words.findIndex(obj => obj.name == token);
  if (index > -1) {
    core_words.at(index).exec();
    return true;
  };
};

function io(token) {
  const index = io_words.findIndex(obj => obj.name == token);
  if (index > -1) {
    io_words.at(index).exec();
    return true;
  };
};

function number(token) {
  if (/^-?\d+$/.test(token)) {
    stack.push(to16bit(+token));
    return true;
  }
};

function error(string) {
  output.innerText += string;
  stack = [];
  return_stack = [];
  quit = true;
};

function to16bit(n) {
  return (n << 16) >> 16;
};

const macro_words = [];
const core_words = [{
    name: 'nop',
    exec: function () {}
  }, {
    name: '!', // store
    exec: function () {
      if (stack.length < 2)
        return error(`\nStack underflow\n>>>!<<< `);
      const [addr, value] = [stack.pop(), stack.pop()];
      memory[addr] = value;
    }
  }, {
    name: '@', // fetch
    exec: function () {
      if (stack.length < 1)
        return error(`\nStack underflow\n>>>@<<< `);
      const [addr] = [stack.pop()];
      stack.push(memory[addr]);
    }
  }, {
    name: 'if', // subleq
    exec: function () {
      if (stack.length < 2)
        return error(`\nStack underflow\n>>>if<<< `);
      const [b, a] = [stack.pop(), stack.pop()];
      stack.push(to16bit(a - b));
      if (stack.at(-1) > 0) {
        while (!['else', 'then'].includes(tokenize())) {
          if (memory[-1] >= instr.length)
            return error(`\nSyntax error\nNo closing tag: then\n>>>if<<< `);
        };
      };
    }
  }, {
    name: 'else',
    exec: function () {
      while (tokenize() != 'then') {
        if (memory[-1] >= instr.length)
          return error(`\nSyntax error\nNo closing tag: then\n>>>else<<< `);
      }
    }
  }, {
    name: 'then',
    exec: function () {}
  }, {
    name: 'push',
    exec: function () {
      if (stack.length < 1)
        return error(`\nStack underflow\n>>>push<<< `);
      return_stack.push(stack.pop());
    }
  }, {
    name: 'pop',
    exec: function () {
      if (return_stack.length < 1)
        return error(`\nReturn stack underflow\n>>>pop<<< `);
      stack.push(return_stack.pop());
    }
  }, {
    name: ':', // define
    exec: function () {
      const name = tokenize();
      const pointer = memory[-1];
      while (tokenize() != ';') {
        if (memory[-1] >= instr.length)
          return error('\nSyntax error\nNo closing tag: ;\n>>>:<<< ');
      }
      const index = macro_words.findIndex(obj => obj.name == name);
      if (index != -1) macro_words.splice(index, 1);
      macro_words.push({name: name, pointer: pointer});
    }
  }, {
    name: ';', // return
    exec: function () {
      if (return_stack.length < 1)
        return error(`\nReturn stack underflow\n>>>;<<< `);
      memory[-1] = return_stack.pop();
    }
  }, {
    name: '(', // comment
    exec: function () {
      while (instr.charAt(memory[-1]++) != ')') {
        if (memory[-1] >= instr.length)
          return error(`\nSyntax error\nNo closing tag: )\n>>>(<<< `);
      };
    }
  }, {
    name: '\\', // comment
    exec: function () {
      while (instr.charAt(memory[-1]++) != '\n') {
        if (memory[-1] >= instr.length)
          return error(`\nSyntax error\nNo closing tag: )\n>>>(<<< `);
      };
    }
}];

const io_words = [{
    name: '.', // print as decimal
    exec: function () {
      if (stack.length < 1)
        return error(`\nStack underflow\n>>>.<<< `);
      output.innerText += stack.pop().toString() + ' ';
    }
  }, {
    name: '.s', // print stack
    exec: function () {
      output.innerText += `<${stack.length}> ${stack.join(' ')} `;
    }
  }, {
    name: '."', // print string
    exec: function () {
      let string = '';
      memory[-1]++;
      while (instr.charAt(memory[-1]) != '"') {
        if (memory[-1] >= instr.length)
          return error(`\nSyntax error\nNo closing tag: "\n>>>."<<< `);
        string += instr.charAt(memory[-1]++);
      };
      memory[-1]++;
      output.innerText += string;
    }
  }, {
    name: 'emit', // print as ASCII
    exec: function () {
      if (stack.length < 1)
        return error(`\nStack underflow\n>>>emit<<< `);
      output.innerText += String.fromCharCode(stack.pop());
    }
  }, {
    name: 'page', // clear output
    exec: function () {
      output.innerText = '';
    }
  }, {
    name: 'words', // see all defined words
    exec: function () {
      macro_words.forEach(obj => output.innerText += obj.name + ' ');
    }
  }, {
    name: 'see', // see word definition
    exec: function () {
      const name = tokenize();
      const index = macro_words.findIndex(obj => obj.name == name);
      if (index == -1)
        return output.innerText += `\nUndefined word\n>>>${name}<<< `;
      let pointer = macro_words.at(index).pointer;
      let string = `\n: ${name}${instr.charAt(pointer)}`;
      while (instr.charAt(pointer++) != ';') {
        string += instr.charAt(pointer);
      };
      output.innerText += string;
    }
  }, {
    name: 'abort', // exits program
    exec: function () {
      error('');
    }
}];

// LOAD SUBFORTH EXTENSION
fetch('main.fs')
  .then(response => response.text())
  .then(data => { load(data); })
  .catch(error => { console.error('Error loading file:', error); });

function load(data) {
  quit = false;
  input.disabled = true;
  memory[-1] = instr.length;
  instr += data;
  thread_input();
};
