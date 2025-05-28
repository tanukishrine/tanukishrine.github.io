PRINT" SUBFORTH v1.0 | OPEN SOURCE 2025 BY T.SZULC "

( -3: KEYBOARD INPUT      )
( -2: PROGRAM RATE/SPEED  )
( -1: PROGRAM COUNTER     )
( 0:  A REGISTER          )
( 1:  B REGISTER          )
( 2:  JUMP ADDRESS        )
( 3:  RETURN POINTER      )
( 4:  RETURN STACK        )
( 5:  ...                 )

( !         n addr --   | store n via addr into memory  )
( ?         addr -- n   | fetch n via addr into stack   )
( -         a b -- a-b  | subtract two values on stack  )
( if then   f --        | conditional statement         )
( : ;       --          | define word/macro             )

( STACK MANIPULATION )
: drop 0 ! ;                      ( a -- )
: dup 0 ! 0 ? 0 ? ;               ( a -- a a )
: swap 0 ! 1 ! 0 ? 1 ? ;          ( a b -- b a )
: over 0 ! 1 ! 1 ? 0 ? 1 ? ;      ( a b -- a b a )
: rot 0 ! 1 ! push 1 ? 0 ? pop ;  ( a b c -- b c a )

( RETURN STACK )
4 3 ! ( @3 is pointer )
: push 3 ? ! 3 ? 1+ 3 ! ; ( n -- )
: pop 3 ? 1- 3 ! 3 ? ? ;  ( -- n )

( PROGRAM COUNTER / FLOW CONTROL )
: here -1 ? -4 - 2 ! ;  ( -- ) ( assign current 'p' into memory )
: jump 2 ? -1 ! ;       ( -- ) ( jump to 'here' )

( MEMORY ADDRESSES )
: a 0 ;     ( -- register_A )
: b 1 ;     ( -- register_B )
: p -1 ;    ( -- program_counter )
: tick -2 ; ( -- program_speed )
: key -3 ;  ( -- current_keypress )

( BITWISE LOGIC )
: not 0 swap - 1 - ; ( n -- !n )

( ARITHMETIC )
: neg 0 swap - ;        ( a -- -a )
: abs dup if neg then ; ( n -- |n| )
: + 0 swap - - ;        ( a b -- a+b )

: 1+ -1 - ;   ( n -- n+1 )
: 1- 1 - ;    ( n -- n-1 )
: 2* dup + ;  ( n -- n*2 )

: 2/
  dup 0< push abs 0 push
  here 2 - dup -1 > if
    pop 1+ push jump then
  drop pop pop if neg then
; ( n -- n/2 )

: *
  0 rot rot
  1 over if
    neg push neg pop
  then push
  here
  dup 0> if
    1- push
    dup push
    +
    pop pop
    jump
  then drop drop
  pop if
    neg then
; ( a b -- a*b )

: /
  0
  here ( a b c ) ( unfinished... )
  dup 0> if
    jump
  then
  drop pop drop pop
; ( a b -- a/b )

: !+ dup ? 1+ swap ! ;    ( addr -- )   ( 1+ to value pointed by addr )
: !- dup ? 1- swap ! ;    ( addr -- )   ( 1- to value pointed by addr )
: +! dup ? rot + swap ! ; ( n addr -- ) ( add n to value pointed by addr )
: -! dup ? rot - swap ! ; ( n addr -- ) ( sub value pointed by addr by n )

( COMPARISON )
: 0< 1+ ;                     ( n -- f )
: 0= dup if neg then dup + ;  ( n -- f )
: 0> neg 1+ ;                 ( n -- f )
: < - 0< ;                    ( a b -- f )
: > - 0> ;                    ( a b -- f )
: != = 0> ;                   ( a b -- f )
: = - 0= ;                    ( a b -- f )

( IO )
: . print 32 emit ; ( n -- )  ( print value with space )
: cr 10 emit ;      ( -- )    ( print newline char )
: space 32 emit ;   ( -- )    ( print space char )
: tab 9 emit ;      ( -- )    ( print tab char )

( ----- )

: .help
  print" Sorry, ".help" has yet to be implemented... "
;

( ----- )

( EXAMPLES )
: fibonacci 0 1 here over over + push push . pop pop jump ; ( print fibonacci sequence indefinitely )
: listen here -3 ? . jump ;                                 ( print keyboard input to output )

cr print" Type ".help" for more information. "
