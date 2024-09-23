const terminal  = document.querySelector("*")
const container = document.querySelector('#container')
const input     = document.querySelector("#input")
const output    = document.querySelector("#output")
const file      = document.querySelector("#file")

const addr = Array(2**14).fill(0)
addr[1] = Number.MAX_SAFE_INTEGER
addr[2] = Number.MAX_SAFE_INTEGER
addr[3] = Number.MAX_SAFE_INTEGER

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
    output.innerHTML += `<br>${msg}<br>${string.join(' ')}<br>`
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
        if (addr.at(0) == 0) output.innerHTML = ''
        else if (addr.at(0) == 10) output.innerHTML += '<br>'
        else output.innerHTML += String.fromCharCode(addr.at(0))
        addr[0] = Number.MAX_SAFE_INTEGER
    }
    // 1: terminal output (decimal)
    else if (addr.at(1) != Number.MAX_SAFE_INTEGER) {
        output.innerHTML += addr.at(1).toString()
        addr[1] = Number.MAX_SAFE_INTEGER
    }
    // 2: foreground color
    else if (addr.at(2) != Number.MAX_SAFE_INTEGER) {
        const index = colors.findIndex(color => color.poke == addr.at(2))
        if (index != -1) terminal.style.color = colors[index].hex
        addr[2] = Number.MAX_SAFE_INTEGER
    }
    // 3: background color
    else if (addr.at(3) != Number.MAX_SAFE_INTEGER) {
        const index = colors.findIndex(color => color.poke == addr.at(3))
        if (index != -1) terminal.style.backgroundColor = colors[index].hex
        addr[3] = Number.MAX_SAFE_INTEGER
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
            output.innerHTML += `redefined ${name}\u00a0`
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
    name: 'include',
    exec: () => {
        container.style.display = 'none'
        file.style.display = 'block'
    }
}]

container.addEventListener('click', () => input.focus())

file.addEventListener('change', event => {
    const source = event.target.files[0]
    if (source) {
        const reader = new FileReader()
        reader.onload = e => parse(filter(e.target.result))
        reader.readAsText(source)
        if (!abort) output.innerHTML += '\u00a0ok<br>'
    }
    file.style.display = 'none'
    container.style.display = 'flex'
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
    hex: '#880000'
}, {
    poke: 3, // cyan
    hex: '#AAFFEE'
}, {
    poke: 4, // violet
    hex: '#CC44CC'
}, {
    poke: 5, // green
    hex: '#00CC55'
}, {
    poke: 6, // blue
    hex: '#0000AA'
}, {
    poke: 7, // yellow
    hex: '#EEEE77'
}, {
    poke: 8, // orange
    hex: '#DD8855'
}, {
    poke: 9, // brown
    hex: '#664400'
}, {
    poke: 10, // light red
    hex: '#FF7777'
}, {
    poke: 11, // dark grey
    hex: '#333333'
}, {
    poke: 12, // grey
    hex: '#777777'
}, {
    poke: 13, // light green
    hex: '#AAFF66'
}, {
    poke: 14, // light blue
    hex: '#0088FF'
}, {
    poke: 15, // light grey
    hex: '#BBBBBB'
}]

// I.O. interface
fetch('extension.fs')
    .then(response => response.text())
    .then(data => parse(filter(data)))
    .catch(error => console.error(error))

input.addEventListener('keyup', event => {
    if (event.key == 'Enter') {
        abort = false
        output.innerHTML += `> ${input.textContent}\u00a0`
        parse(filter(input.textContent))
        input.textContent = ''
        if (!abort) output.innerHTML += '\u00a0ok<br>'
    }
});
