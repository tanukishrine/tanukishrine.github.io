const output_html		= document.getElementById('output');
const input_html		= document.getElementById('input');
const cursor_html		= document.getElementById('cursor');
const autofocus_html	= document.getElementById('autofocus');
const stack_html		= document.getElementById('stack');

// FORTH values
const index				= [];
const stack				= [];
const return_stack		= [];
const output_text		= [];
const user_words		= [];
const memory			= Array(64000);
let   error 			= false;

// PRINT values
const print_rows		= 42;
let stack_toggle		= false;

// START UP
const space = '\u00a0';
let startup_spacing = ''; for (let i = 0; i < 14; i++) startup_spacing += space;
output_text.push(`${startup_spacing}==== WEB-BASED FORTH-SCRIPT v1.0 ====`);
output_text.push(`${startup_spacing}==== OPEN SOURCE 2024 BY T.SZULC ====`);
output_print(false);

// READ UI INTERACTIONS
autofocus_html.addEventListener('click', function () {
	input_html.focus();
	update_cursor();
});
input_html.addEventListener('keydown', function (event) {
	if (event.key === 'Enter')		input_submit();
	if (event.key === "ArrowUp")	scroll_up();
	if (event.key === "ArrowDown")	scroll_down();
	if (event.key === "Escape")		input_html.value = '';
//	if (event.key === "Alt")		toggle_editor();
	update_cursor();
});
input_html.addEventListener('keyup', function (event) {
	if (event.key === 'Enter') {
		scroll_reset();
		input_html.value = '';
		update_cursor();
		output_print();
		stack_update();
	};
});

// CURSOR BEHAVIOR
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function update_cursor() {
	await sleep(1);
	let cursor_position = input_html.selectionStart;
	while (cursor_position > 64) cursor_position -= 64;
	let string = []; for (let i = 0; i < cursor_position; i++) string.push(space);
	cursor_html.innerText = string.join('') + '\u2588';	// block character
};
setInterval(cursor_blinker, 400);
let blinker = true;
function cursor_blinker() {
	if (blinker && document.activeElement == input_html)
		cursor_html.style.display = 'block'
	else cursor_html.style.display = 'none';
	blinker = !blinker;
};

// INPUT HISTORY
let scroll_index = 0;
const input_history = [''];
function scroll_reset() {
	input_history.unshift(input_html.value.split(/\n/).join(''));
	while (input_history.length > 42) input_history.pop();
	scroll_index = 0;
};
function scroll_up() {
	input_html.value = input_history[scroll_index];
	if (scroll_index === input_history.length - 1) return; scroll_index++;
};
function scroll_down() {
	if (scroll_index === 0) { input_html.value = ''; return; };
	scroll_index--; input_html.value = input_history[scroll_index];
};

// STACK VIEWER
function stack_update() {
	let string = `<${stack.length}> ${stack.join(', ')}`;
	stack_html.innerText = string;
};
function toggle_stack() {
	if (stack_toggle) {
		stack_toggle = false;
		stack_html.style.display = 'none';
	} else {
		stack_toggle = true;
		stack_html.style.display = 'block';
	};
};

// INPUT PARSER
function input_submit() {
	const input_string = input_html.value.replace('\n', ' ');
	const input_array = input_html.value.split(/[ \n\t]+/).filter(word => word.length !== 0);
	output_text.push(input_string + ' ');
	parse_array(input_array);
	output_print(true);
};

// OUTPUT PRINTER
function output_print(ok) {
	let i = 0; while (i < output_text.length) {
		if (output_text[i].length > 64) {
			const string = output_text[i];
			output_text[i] = string.slice(0, 64);
			output_text.splice(i + 1, 0, string.slice(64));
		}; i++;
	};
	const n_rows = print_rows - stack_toggle;
	while (output_text.length >= n_rows) output_text.shift();
	if (ok && !error) output_text[output_text.length - 1] += ' OK';
	output_html.innerText = output_text.join('\n');
};

// INDEX CONTROLS
function index_init()	{ index.push(0); };
function index_pop()	{ index.pop(); };
function index_fetch()	{ return index[index.length - 1]; };
function index_inc()	{ index[index.length - 1] = index_fetch() + 1; };

// ITERATE THROUGH INSTRUCTIONS
function parse_array(value) {
	index_init();
	error = false;
	while (index_fetch() !== value.length)	{
		if (error) break;
		interpret_word(value[index_fetch()], value);
		index_inc();
	};
	index_pop();
};

// INTERPRET WORD
function interpret_word(word, array) {
	console.log(word, array);
	if (word.length === 0) return;
	if (is_userVocabulary(word, array)) return;
	if (is_forthVocabulary(word, array)) return;
	if (is_number(word)) return;
	init_error0(word);
};

function is_userVocabulary(word) {		// check for capitalization
	const word_index = user_words.findIndex(object => object.name === word)
	if (word_index >= 0) { parse_array(user_words[word_index].content); return true; };
	return false;
};

function is_forthVocabulary(word, array) {
	const word_index = forth_words.findIndex(object => object.name === word.toUpperCase());
	if (word_index >= 0) { forth_words[word_index].exec(word, array); return true; };
	return false;
};

function is_number(word) {
	if (isNaN(word)) return false;
	stack.push(parseFloat(word)); return true;
};

const forth_words = [{
// STACK INSTRUCTIONS
	name: 'DUP',
	exec: function () {
		stack.push(stack[stack.length - 1]);
	}
}, {
	name: 'DROP',
	exec: function () {
		stack.pop();
	}
}, {
	name: 'SWAP',
	exec: function () {
		stack.splice(stack.length - 2, 0, stack.pop());
	}
}, {
	name: 'OVER',
	exec: function () {
		stack.push(stack.slice(stack.length - 2, stack.length - 1).pop());
	}
}, {
	name: 'ROT',
	exec: function () {
		stack.push(stack.splice(stack.length - 3, 1).pop());
	}
}, {
	name: '?DUP',
	exec: function () {
		if (stack[stack.length - 1] !== 0) stack.push(stack[stack.length - 1]);
	}
}, {
	name: '>R',
	exec: function () {
		return_stack.push(stack.pop());
	}
}, {
	name: 'R>',
	exec: function () {
		stack.push(return_stack.pop());
	}
}, {
	name: 'R@',
	exec: function () {
		stack.push(return_stack[return_stack.length - 1]);
	}
}, {
	name: '+',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 + n2);
	}
}, {
	name: '-',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 - n2);
	}
}, {
	name: '*',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 * n2);
	}
}, {
	name: '/',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 / n2);
	}
}, {
	name: '%',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 % n2);
	}
}, {
	name: 'MAX',
	exec: function () {
		stack.push(Math.max(stack.pop(), stack.pop()));
	}
}, {
	name: 'MIN',
	exec: function () {
		stack.push(Math.min(stack.pop(), stack.pop()));
	}
}, {
	name: 'ABS',
	exec: function () {
		stack.push(Math.abs(stack.pop()));
	}
}, {
	name: 'MINUS',
	exec: function () {
		stack.push(-stack.pop());
	}
}, {
	name: 'AND',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 && n2);
	}
}, {
	name: 'OR',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 || n2);
	}
}, {
	name: 'XOR',
	exec: function () {
		const [n2, n1] = [stack.pop(), stack.pop()]; stack.push(n1 ^ n2);
	}
}, {
	name: '<',
	exec: function () {
		stack.push(stack.pop() > stack.pop());
	}
}, {
	name: '>',
	exec: function () {
		stack.push(stack.pop() < stack.pop());
	}
}, {
	name: '=',
	exec: function () {
		stack.push(stack.pop() == stack.pop());
	}
}, {
	name: '0<',
	exec: function () {
		stack.push(stack.pop() < 0);
	}
}, {
	name: '0=',
	exec: function () {
		stack.push(stack.pop() == 0);
	}
}, {
	name: '"', // => include some way to include space characters
	exec: function (word, array) {
		stack.push(array[index[index.length - 1] + 1]);
		index[index.length - 1] = index[index.length - 1] + 1;
	}
}, {
	name: 'S"',
	exec: function (word, array) {
		let i = index[index.length - 1] + 1;
		const string = [];
		for (i; i < array.length - 1; i++) {
			if (array[i] === '"') { break; }
			string.push(array[i]);
		};
		console.log(array);
		console.log(i);
		index[index.length - 1] = i;
		stack.push(string.join(' '));
	}
}, {
	name: '.',
	exec: function () {
		output_text[output_text.length - 1] += `${stack.pop()} `;
	}
}, {
	name: '.S',
	exec: function () {
		output_text[output_text.length - 1] += `<${stack.length}> ${stack.join(', ')} `;
	}
}];

function exec_instructions(word, array) {
// INPUT OUTPUT INSTRUCTIONS
	if (word === '.')		{ output_text[output_text.length - 1] += stack.pop() + space; return; };
	if (word === '.S')		{ let string = `<${stack.length}> ${stack.join(', ')}`;
							output_text[output_text.length - 1] += string + space; return; };
	if (word === '.R')		{ let string = ''; const count = stack.pop();
							for (let i = 0; i < count; i++) string += space;
							output_text[output_text.length - 1]
							+= string + stack.pop() + space; return; };
	if (word === 'CR')		{ output_text.push(''); return; };
	if (word === 'SPACE')	{ output_text[output_text.length - 1] += space; return; };
	if (word === 'SPACES')	{ let string = ''; const count = stack.pop();
							for (let i = 0; i < count; i++) string += space;
							output_text[output_text.length - 1] += string; return; };
	if (word === 'PAGE')	{ while (output_text.length > 0) output_text.pop(); return; };
	if (word === '."')		{ let i = index[index.length - 1] + 1; let string = '';
							while (array[i] !== '"') {
								if (i === array.length) { i--; break; };
								string += array[i] + space; i++;
							};
							index[index.length - 1] = i;
							output_text[output_text.length - 1] += string; return; };
	if (word === 'DUMP')	{const [u, addr] = [stack.pop(), stack.pop()];
							for (let i = addr; i < addr + u; i++)
								output_text.push(`${i}: ${memory[i]} - ${typeof memory[i]}`);
							output_text.push(''); return; };
	if (word === 'TYPE')	{const [u, addr] = [stack.pop(), stack.pop()];
							for (let i = addr; i < addr + u; i++)
								output_text[output_text.length - 1]
								+= memory[i]; return; };
//	if (word === 'KEY')		{ return; };
//	if (word === 'EXPECT')	{ return; };
// MEMORY AND DICTIONARY INSTRUCTIONS
	if (word === '@')		{ stack.push(memory[stack.pop()]); return; };
	if (word === '!')		{ memory[stack.pop()] = stack.pop(); return; };
	if (word === '?')		{ output_text[output_text.length - 1]
							+= memory[stack.pop()]; return; };
	if (word === '+!')		{ memory[stack.pop()] += stack.pop(); return; };
	if (word === 'MOVE')	{ const [u, to, from] = [stack.pop(), stack.pop(), stack.pop()];
							const temp = memory.slice(from, from + u);
							memory.splice(to, u, ...temp); return; };
	if (word === 'FILL')	{ const [b, u, addr] = [stack.pop(), stack.pop(), stack.pop()];
							for (let i = addr; i < addr + u; i++)
								memory[i] = b; return; };
	if (word === 'ERASE')	{ const [u, addr] = [stack.pop(), stack.pop()];
							for (let i = addr; i < addr + u; i++)
								memory[i] = null; return; };
	if (word === 'BLANKS')	{ const [u, addr] = [stack.pop(), stack.pop()];
							for (let i = addr; i < addr + u; i++)
								memory[i] = undefined; return; };
/*			INCLUDE DATA-SPACE POINTER
	if (word === 'HERE')	{ let addr = 0;
							while (typeof memory[addr] !== 'undefined') addr++;
							stack.push(addr); return; };
	if (word === 'ALLOT')	{ let addr = 0; u = stack.pop();
							while (typeof memory[addr] !== 'undefined') addr++;
							for (let i = addr; i < addr + u; i++)
								memory[i] = null; return; };
	if (word === ',')		{ let addr = 0;
							while (typeof memory[addr] !== 'undefined') addr++;
							memory[addr] = stack.pop(); return; };
	if (word === "'")		{ let addr = 0;
							while (typeof memory[addr] !== 'string'
								&& addr < memory.length) addr++;
							stack.push(addr); return; };
*/
	if (word === 'FORGET')	{ let i = index[index.length - 1] + 1;
							if (array[i].toUpperCase() === "ALL") {
								while (words.length !== 0) words.pop();
								output_text[output_text.length - 1]
								+= `CLEARED ALL USER DEFINED WORDS `;
								index[index.length - 1] = i; return;
							}; const word_index = words.indexOf(object =>
								object.name === array[i].toUpperCase())
							if (word_index >= 0) {
								words.splice(word_index, 1);
								output_text[output_text.length - 1]
								+= `CLEARED ${array[i]} WORD `;
								index[index.length - 1] = i; return;
							}; init_error3(array[i]); return; };
	if (word === 'WORDS')	{ let string = instructions.join(' ');
							words.forEach(item => string += ' ' + item.name.toUpperCase());
							output_text.push(string + space); return; };
	if (word === 'SEE')		{ let i = index[index.length - 1] + 1;
							const word_index = words.findIndex(word => word.name.toUpperCase()
								=== array[i].toUpperCase());
							if (word_index >= 0) {
								const word = words[word_index];
								output_text.push(`: ${word.name} ${word.content.join(' ')} ;`)
							} else if (instructions.includes(array[i].toUpperCase()))
								output_text.push(`Core code.`);
							else init_error0(array[i]);
							index[index.length - 1] = i; return; };
// DEFINING AND CONTROL STRUCTURE INSTRUCTIONS
	if (word === ':')		{ let i = index[index.length - 1] + 1;
							const object = {};
							object.name = array[i];
							object.content = []; i++;
							while (array[i] !== ';') {
								if (i >= array.length) { init_error1(';'); return; };
								object.content.push(array[i]); i++;
							};
							index[index.length - 1] = i;
							const word_index = words.findIndex(word => word.name === object.name);
							if (word_index >= 0) {
								words.splice(word_index, 1);
								output_text[output_text.length - 1] += `redefined ${object.name} `;
							};
							words.push(object); return; };
	if (word === 'VAR')		{ let i = index[index.length - 1] + 1; let addr = 63000;
							if (i >= array.length) { init_error2('VAR'); return; };
							while (typeof memory[addr] !== 'undefined') addr++;
							memory[addr] = null;
							object = {name: array[i], content: [addr.toString()] };
							index[index.length - 1] = i;
							const var_index = words.findIndex(variable => variable.name === object.name);
							if (var_index >= 0) {
								words.splice(var_index, 1);
								output_text[output_text.length - 1] += `redefined ${object.name} `;
							};
							words.push(object); return; };
	if (word === 'CONST')	{ let i = index[index.length - 1] + 1;
							if (i >= array.length) { init_error2('CONST'); return; };
							while (typeof memory[addr] !== 'undefined') addr++;
							object = {name: array[i], content: [stack.pop().toString()] };
							index[index.length - 1] = i;
							const const_index = words.findIndex(constant => constant.name === object.name);
							if (const_index >= 0) {
								words.splice(const_index, 1);
								output_text[output_text.length - 1] += `redefined ${object.name} `;
							};
							words.push(object); return; };
	if (word === ':CODE')	{ let i = index[index.length - 1] + 1;
							let string = [];
							while (array[i].toUpperCase() !== ';CODE') {
								if (array[i] === '') string[string.length - 1] += ' ';
								else string.push(array[i]); i++;
								if (i === array.length - 1) break;
							};
							index[index.length - 1] = i;
							eval(string.join(' ')); return; };
/*
	if (word === 'FUNC')
	if (word === 'DO')
	if (word === 'LOOP')
	if (word === '+LOOP')
	if (word === 'I')
	if (word === 'LEAVE')
	if (word === 'IF')
	if (word === 'ELSE')
	if (word === 'THEN')
	if (word === 'BEGIN')
	if (word === 'UNTIL')
	if (word === 'REPEAT')
	if (word === 'WHILE')
// MISCELLANEOUS INSTRUCTIONS
	if (word === '(')
	if (word === 'ABORT')
	if (word === 'SP@')
*/
	if (word === 'STACK')	{ toggle_stack(); return; };
};

function reset_stack() {
	while (stack.length !== 0) stack.pop();
	while (return_stack.length !== 0) return_stack.pop();
	error = true;
};
function init_error0(word) {
	output_text.push(`UNDEFINED WORD`);
	output_text.push(`:= ${word} =:`);
	reset_stack();
};
function init_error1(word) {
	output_text.push(`NO CLOSING TAG`);
	output_text.push(`:= ${word} =:`)
	reset_stack();
};
function init_error2(type) {
	output_text.push(`ATTEMPT TO USE ZERO-LENGTH STRING AS A NAME.`);
	output_text.push(`${type} >>><<<`);
	reset_stack();
};
function init_error3(word) {
	output_text.push(`UNDEFINED WORD NAME`);
	output_text.push(`FORGET >>>${word}<<<`);
	reset_stack();
};
