const output = document.getElementById('output');
const input = document.getElementById('input');
const caret = document.getElementById('caret')

document.addEventListener('click', () => input.focus());
document.addEventListener('click', update_caret);


input.addEventListener('focus', () => caret.style.display = 'block');
input.addEventListener('blur',  () => caret.style.display = 'none');
input.addEventListener('keyup', update_caret);
input.addEventListener('keydown', update_caret);
input.addEventListener('click', update_caret);
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) };
async function update_caret() {
  await delay(1)
  update_caret_position();
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  window.scrollTo(0, document.body.scrollHeight);
};

function update_caret_position() {
  if (input.value.length === input.selectionStart)
    return caret.innerHTML =
      input.value.substring(0, input.selectionStart) +
      '<span class="blink non-collide">\u2588</span>';
  if (input.selectionStart === input.selectionEnd)
    return caret.innerHTML =
      input.value.substring(0, input.selectionStart) + '<span class="blink highlight">' +
      input.value.substring(input.selectionStart, input.selectionEnd + 1) + '</span>' +
      input.value.substring(input.selectionEnd + 1, input.value.length);
  return caret.innerHTML =
    input.value.substring(0, input.selectionStart) + '<span class="blink highlight">' +
    input.value.substring(input.selectionStart, input.selectionEnd) + '</span>' +
    input.value.substring(input.selectionEnd, input.value.length);
};
