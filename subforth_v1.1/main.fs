." SUBFORTH v1.1 | OPEN SOURCE 2025 BY T.SZULC"
5000 -2 ! \ set tick rate


( RETURN | STACK | MEMORY )

\ -2: TICK RATE
\ -1: PROGRAM COUNTER
\  0: A REGISTER
\  1: B REGISTER (UNUSED)


\ STACK MANIPULATION

: drop ( a -- )
  0 !
;

: dup ( a -- a a )
  0 ! 0 @ 0 @
;

: swap ( a b -- b a )
  push 0 ! pop 0 @
;

: over ( a b -- a b a )
  push 0 ! 0 @ pop 0 @
;

: rot ( a b c -- b c a )
  push push 0 ! pop pop 0 @
;

: nip ( a b -- b )
  push 0 ! pop
;

: tuck ( a b -- b a b )
  0 ! push 0 @ pop 0 @
;


\ ARITHMETIC

: - ( a b -- a-b )
  if then
;

: + ( a b -- a+b )
  push 0 pop - -
;

: not ( n -- !n )
  push 0 pop - 1 -
;

: neg ( n -- -n )
  push 0 pop -
;

: abs ( n -- |n| )
  0 if neg then
;

: 1+ ( n -- n++ )
  -1 if then
;

: 1- ( n -- n-- )
  1 if then
;

: 2* ( n -- n<<1 )
  dup +
;

: 2/ ( n -- n>>1 )
  push 0 pop
  here
  1 if
    drop leave
  else
    1 - push 1+ pop loop
  then
;

: 2% ( n -- n&1 )
  here
  1 if
    1+ leave
  else
    1 - loop
  then
;

: +* ( a b r -- 2a b/2 r+a | 2a b/2 r )
  push
  dup 2% 0 if drop
  else drop
    over pop + push
  then
  2/ push
  2* pop pop
;

: * ( a b -- a*b )
  0
  here
  over 0 if drop
    nip nip leave
  else drop
    +* loop
  then
;

: / ( a b -- a/b )
  push push
  -1 pop pop
  here
  over -1 if drop
    drop drop leave
  else drop
    dup push - push
    1+ pop pop loop
  then
;

: % ( a b -- a%b )
  here
  over over -
  -1 if drop
    drop leave
  else drop
    tuck - swap loop
  then
;


\ COMPARISON

: 0< ( n -- f0 f1 )
  -1
;

: 0= ( n -- f0 f1 )
  0 if neg then dup + 0
;

: 0> ( n -- f0 f1 )
  push 1 pop
;

: < ( a b -- f0 f1 )
  - 0<
;

: > ( a b -- f0 f1 )
  - 0>
;

: = ( a b -- f0 f1 )
  - 0=
;

: <> ( a b -- f0 f1 )
  = !f
;

: !f ( f0 f1 -- ![f0 f1] )
  if drop 1 else drop 0 then 0
;


\ FLOW CONTROL

: exit ( -- )
  pop drop
; \ exit word

: here ( -- )
  pop dup push push
; \ set pointer

: loop ( -- )
  pop drop pop dup push push
; \ goto 'here'

: leave ( -- )
  pop pop drop push
; \ safely exit 'here-loop'

: while ( f0 f1 -- )
  if drop pop drop pop dup push push
  else drop pop pop drop push then
; \ goto 'here' while condition true


\ MEMORY

: !+ ( addr -- )
  dup @ 1+ swap !
; \ 1+ to value pointed by addr

: !- ( addr -- )
  dup @ 1- swap !
; \ 1- to value pointed by addr

: +! ( n addr -- )
  dup @ rot + swap !
; \ add n to value pointed by addr

: -! ( n addr -- )
  dup @ rot - swap !
; \ sub value pointed by addr by n


\ INPUT OUTPUT

: cr ( -- )
  10 emit
;

: space ( -- )
  32 emit
; 

: tab ( -- )
  9 emit
;

: block ( -- )
  219 emit
;

: ascii ( -- )
  cr 32
  here
  dup . dup emit tab
  dup 5 % 0= if drop
    cr
  else drop then
  1+
  dup 256 < while
  drop
;


\ MISCELLANEOUS

: .title ( -- )
  -2 @ 1 -2 ! cr
  ."            _     _____          _   _     " cr
  ."  ___ _   _| |__ |  ___|__  _ __| |_| |__  " cr
  ." / __| | | | '_ \| |_ / _ \| '__| __| '_ \ " cr
  ." \__ \ |_| | |_) |  _| (_) | |  | |_| | | |" cr
  ." |___/\__,_|_.__/|_|  \___/|_|   \__|_| |_|" cr
  -2 !
; .title


\ RULE 110

\ MEMORY
\ 101-164 ( slide a )
\ 201-264 ( slide b )

: get-state ( position -- state )
  dup dup
  1- @ 0= if drop
    000 push
  else drop
    100 push
  then
  @ 0= if drop
    00 push
  else drop
    10 push
  then
  1+ @ 0= if drop
    0 push
  else drop
    1 push
  then
  pop pop pop + +
;

: range-print ( start end -- )
  here
  over @ 0= if drop
    space
  else drop
    block
  then
  push 1+ pop
  over over < while
  drop drop
;

: 110rule ( state -- cell )
  dup 111 = if drop
    drop 0 exit
  then drop
  dup 110 = if drop
    drop 1 exit
  then drop
  dup 101 = if drop
    drop 1 exit
  then drop
  dup 100 = if drop
    drop 0 exit
  then drop
  dup 011 = if drop
    drop 1 exit
  then drop
  dup 010 = if drop
    drop 1 exit
  then drop
  dup 001 = if drop
    drop 1 exit
  then drop
  dup 000 = if drop
    drop 0 exit
  then drop
  ." ERROR: 110rule" abort
;

: span_0 ( start end -- )
  here
  over get-state 110rule push
  over 100 + pop swap !
  push 1+ pop
  over over < while
  drop drop
;

: span_1 ( start end -- )
  here
  over get-state 110rule push
  over 100 - pop swap !
  push 1+ pop
  over over < while
  drop drop
;

: rule110 ( -- )
  1 163 ! cr
  here
    0 here
      100 164 range-print cr
      100 164 span_0
      200 264 range-print cr
      200 264 span_1
      1+
    dup 20 < while drop
    page
  loop
;
