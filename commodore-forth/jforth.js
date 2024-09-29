const terminal  = document.querySelector("*")
const caret     = document.querySelector("#caret")
const input     = document.querySelector("#input")
const output    = document.querySelector("#output")
const file      = document.querySelector("#file")

const addr = Array(2**14).fill(0)
addr[0] = Number.MAX_SAFE_INTEGER
addr[1] = Number.MAX_SAFE_INTEGER
addr[2] = Number.MAX_SAFE_INTEGER
addr[3] = Number.MAX_SAFE_INTEGER
addr[4] = Number.MAX_SAFE_INTEGER

const p = {}
const r = {}
const d = {}

let P = 0
let R = 0

let T = 0
let S = 0

let A = 0
let B = 0

r.stack = Array(8).fill(0)
d.stack = Array(8).fill(0)

d.push = n => {
    d.stack.push(S)
    d.stack.shift()
    S = T
    T = n
}

d.pop = n => {
    n = T
    T = S
    S = d.stack.pop()
    d.stack.unshift(S)
    return n
}

r.push = n => {
    r.stack.push(R)
    r.stack.shift()
    R = n
}

r.pop = n => {
    n = R
    R = r.stack.pop()
    r.stack.unshift(R)
    return n
}

p.push = n => {
    r.push(P)
    P = n
}

p.pop = n => {
    P = r.pop()
}

function filter(chunk) {
    return chunk
        .split(/[ \t\n\u00A0]/)
        .filter(word => word != '')
}

function parse(chunk) {
    p.push(0)
    while (P < chunk.length) {
        if (P < 0) break
        read(chunk.at(P), chunk)
        if (abort) return
        check_io()
        P++
    }
    p.pop()
}

function read(word, chunk) {
    let i
    i = dict.findIndex(obj => obj.name == word)
    if (i != -1) return parse(dict[i].chunk)
    i = ops.findIndex(obj => obj.name == word)
    if (i != -1) return ops[i].exec(chunk)
    i = /^-{0,1}[0-9]+$/
    if (i.test(word)) return d.push(parseInt(word))
    error('Undefined word', chunk)
}

let abort = false
function error(msg, chunk) {
    abort = true
    const string = [...chunk]
    string[P] = `>>>${chunk.at(P)}<<<`
    temp.push(msg)
    temp.push(string.join(' '))
    d.stack.fill(0)
    r.stack.fill(0)
    P = 0
    R = 0
    T = 0
    S = 0
    A = 0
    B = 0
}

function check_io() {
    // 0: terminal output (ascii)
    if (addr.at(0) != Number.MAX_SAFE_INTEGER) {
        if (addr.at(0) == 0) [temp, text] = [[], []]
        else if (addr.at(0) == 10) temp.push('')
        else temp_join(String.fromCharCode(addr.at(0)))
        addr[0] = Number.MAX_SAFE_INTEGER
    }
    // 1: terminal output (decimal)
    else if (addr.at(1) != Number.MAX_SAFE_INTEGER) {
        temp_join(addr.at(1).toString())
        addr[1] = Number.MAX_SAFE_INTEGER
    }
    // 2: foreground color
    else if (addr.at(2) != Number.MAX_SAFE_INTEGER) {
        const index = colors.findIndex(color => color.poke == addr.at(2))
        if (index != -1) document.documentElement.style
            .setProperty('--fg-color', colors[index].hex)
        addr[2] = Number.MAX_SAFE_INTEGER
    }
    // 3: background color
    else if (addr.at(3) != Number.MAX_SAFE_INTEGER) {
        const index = colors.findIndex(color => color.poke == addr.at(3))
        if (index != -1) document.documentElement.style
            .setProperty('--bg-color', colors[index].hex)
        addr[3] = Number.MAX_SAFE_INTEGER
    }
    // 4: border color
    else if (addr.at(4) != Number.MAX_SAFE_INTEGER) {
        const index = colors.findIndex(color => color.poke == addr.at(4))
        if (index != -1) document.documentElement.style
            .setProperty('--br-color', colors[index].hex)
        addr[4] = Number.MAX_SAFE_INTEGER
    }
}

const dict = []
const ops = [{
// Jumps
    name: ':',
    exec: chunk => {
        const a = P + 2
        const b = chunk.slice(a).findIndex(word => word == ';')
        if (b == -1) return error("Missing ';' token", chunk)
        const name = chunk.at(P + 1)
        const i = dict.findIndex(obj => obj.name == name)
        if (i != -1) {
            dict.splice(i, 1)
            temp.push(`redefined ${name}\u00a0`)
        }
        dict.push({ name: name, chunk: chunk.slice(a, a + b) })
        P = a + b
    }
}, {
    name: '->',
    exec: chunk => {
        const i = chunk.slice(P).findIndex(word => word == '>!')
        if (i == -1) return P = -2
        P += i
    }
}, {
    name: '>!',
    exec: () => {}
}, {
    name: '<-',
    exec: chunk => {
        const i = chunk.slice(0, P).reverse().findIndex(word => word == '!<')
        if (i == -1) return P = -1
        P -= i + 1
    }
}, {
    name: '!<',
    exec: () => {}
}, {
    name: 'next',
    exec: chunk => {
        if (R == 0) return r.pop()
        R--
        const i = chunk.slice(0, P).reverse().findIndex(word => word == 'for')
        if (i == -1) return P = -1
        P -= i + 1
    }
}, {
    name: 'for',
    exec: () => r.push(d.pop())
}, {
    name: 'if',
    exec: chunk => {
        if (T == 0) return
        const i = chunk.slice(P).findIndex(word => word == 'then')
        if (i == -1) return P = -2
        P += i
    }
}, {
    name: '-if',
    exec: chunk => {
        if (T < 0) return
        const i = chunk.slice(P).findIndex(word => word == 'then')
        if (i == -1) return P = -2
        P += i
    }
}, {
    name: 'then',
    exec: () => {}
}, {
// Memory
    name: '@+',
    exec: () => { d.push(addr.at(A)); A++ }
}, {
    name: '@b',
    exec: () => d.push(addr.at(B))
}, {
    name: '@',
    exec: () => d.push(addr.at(A))
}, {
    name: '!+',
    exec: () => { addr[A] = d.pop(); A++ }
}, {
    name: '!b',
    exec: () => addr[B] = d.pop()
}, {
    name: '!',
    exec: () => addr[A] = d.pop()
}, {
// ALU
    name: '+*',
    exec: () => {
        if (A & 1 != 0) T += S
        S <<= 1
        A >>= 1
    }
}, {
    name: '2*',
    exec: () => T <<= 1
}, {
    name: '2/',
    exec: () => T >>= 1
}, {
    name: 'inv',
    exec: () => T = ~T
}, {
    name: '+',
    exec: () => d.push(d.pop() + d.pop())
}, {
    name: 'and',
    exec: () => d.push(d.pop() & d.pop())
}, {
    name: 'xor',
    exec: () => d.push(d.pop() ^ d.pop())
}, {
// Stack
    name: 'drop',
    exec: () => d.pop()
}, {
    name: 'dup',
    exec: () => d.push(T)
}, {
    name: 'over',
    exec: () => d.push(S)
}, {
    name: '>r',
    exec: () => r.push(d.pop())
}, {
    name: 'r>',
    exec: () => d.push(r.pop())
}, {
    name: 'nop',
    exec: () => {}
}, {
// Register
    name: 'p',
    exec: () => d.push(P)
}, {
    name: 'a',
    exec: () => d.push(A)
}, {
    name: 'p!',
    exec: () => P = d.pop()
}, {
    name: 'a!',
    exec: () => A = d.pop()
}, {
    name: 'b!',
    exec: () => B = d.pop()
}, {
// Miscellaneous
    name: '(',
    exec: chunk => {
        const i = chunk.slice(P).findIndex(word => word == ')')
        if ( i == -1 ) return error("Missing ')' token", chunk)
        P += i
    }
}, {
    name: 'words',
    exec: () => {
        temp.push('')
        ops.forEach(word => temp_join(word.name + ' '))
        dict.forEach(word => temp_join(word.name + ' '))
    }
}, {
    name: 'forget',
    exec: chunk => {
        P++
        const i = dict.findIndex(word => word.name == chunk.at(P))
        if (i == -1) error('No such word defined', chunk)
        dict.splice(i, 1)
    }
}, {
    name: 'forget!',
    exec: chunk => {
        P++
        while (dict.length) dict.pop()
    }
}, {
    name: 'include',
    exec: () => {
        input.style.display = 'none'
        file.style.display = 'block'
    }
}]

// forth file upload
file.addEventListener('change', event => {
    const load = e => {
        parse(filter(e.target.result))
        if (!abort) temp_join('\u00a0ok')
        groom()
    }
    const source = event.target.files[0]
    if (source) {
        const reader = new FileReader()
        reader.onload = e => load(e)
        reader.readAsText(source)
    }
    file.style.display = 'none'
    input.style.display = 'block'
    input.focus()
})

const colors = [{
    poke: 0, // black
    hex: '#000000'
}, {
    poke: 1, // white
    hex: '#FFFFFF'
}, {
    poke: 2, // red
    hex: '#924A40'
}, {
    poke: 3, // cyan
    hex: '#84C5CC'
}, {
    poke: 4, // violet
    hex: '#9351B6'
}, {
    poke: 5, // green
    hex: '#72B14B'
}, {
    poke: 6, // blue
    hex: '#483AAA'
}, {
    poke: 7, // yellow
    hex: '#D5DF7C'
}, {
    poke: 8, // orange
    hex: '#99692D'
}, {
    poke: 9, // brown
    hex: '#675200'
}, {
    poke: 10, // light red
    hex: '#C18178'
}, {
    poke: 11, // dark grey
    hex: '#606060'
}, {
    poke: 12, // grey
    hex: '#8A8A8A'
}, {
    poke: 13, // light green
    hex: '#B3EC91'
}, {
    poke: 14, // light blue
    hex: '#867ADE'
}, {
    poke: 15, // light grey
    hex: '#B3B3B3'
}]

// output display
let temp = []; temp.push('')
let text = []
function groom() {
    text.push(...temp); temp = []
    for (let i = 0; i < text.length; i++) if (text.at(i).length > 64)
        text.splice(i, 1, text.at(i).slice(0, 64), text.at(i).slice(64))
    while (text.length >= 40) text.shift()
    output.innerHTML = ''
    text.forEach(text => output.innerHTML += `<span>${text}</span><br/>`)
}

const temp_join = string => temp[temp.length - 1] += string

// extended forth vocab
fetch('extension.fs')
    .then(response => response.text())
    .then(data => { parse(filter(data)); groom() })
    .catch(error => console.error(error))

// input
input.addEventListener('keyup', event => {
    if (event.key == 'Enter') {
        abort = false
        temp.push(`${input.value}\u00a0`)
        parse(filter(input.value))
        input.value = ''
        if (!abort) temp_join('\u00a0ok')
        groom()
    }
});

// caret display
input.addEventListener('keyup',   update_caret)
input.addEventListener('keydown', update_caret)
input.addEventListener('click',   update_caret)
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
async function update_caret() {
    await delay(1)
    const position = input.selectionStart
    const spaces = []
    for (let i = 0; i < position; i++) spaces.push('\xa0')
    if (position >= 64 ) caret.style.display = 'none'
    else caret.style.display = 'block'
    caret.innerHTML = spaces.join('') + '\u2588'
}

input.addEventListener('focus', () => caret.style.display = 'block')
input.addEventListener('blur',  () => caret.style.display = 'none')
