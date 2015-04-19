var canvas = $('#ants_canvas')[0]
var context = canvas.getContext('2d');
var can_sound = new Audio('canwhistle.ogg');
var snd_bird1 = new Audio('Bird1.ogg');
var snd_bird2 = new Audio('Bird2.ogg');
var snd_bird3 = new Audio('Bird3.ogg');
var snd_bird5 = new Audio('Bird5.ogg');
var snd_pianoloop = new Audio('PianoLine.ogg');
snd_pianoloop.loop = true;

var WIDTH = 800, HEIGHT = 600;
var GRID_WIDTH = 400, GRID_HEIGHT = 300;
var RAID_GRID_WIDTH = 40, RAID_GRID_HEIGHT = 30;
var MAX_ANTS = 200;

var sandwich_img = new Image();
var enemy_sandwich_img = new Image();
var anthill_img = new Image();
var muted_img = new Image();
var notmuted_img = new Image();
var restart_img = new Image();

var player_sandwich,
    enemy_sandwich,
    geometry,
    nests,
    ants,
    raid_grid;

var victory;

var raid_max;
var raid_cur;

var muted = false;

var level_title = $('#level_title');

var ticks = 0;
var moves = 0;

function unmute() {
   snd_pianoloop.play();
   muted = false;
}

function mute() {
   snd_pianoloop.pause();
   snd_bird1.pause();
   snd_bird2.pause();
   snd_bird3.pause();
   snd_bird5.pause();
   muted = true;
}

function toggleMute() {
   if (muted)
      unmute();
   else
      mute();
}

// GAME LOGIC ---

var spawn_dir = 0;

function spawnAnts()
{
   if (ants.length < MAX_ANTS) {
      spawn_dir = (spawn_dir + 1) % 4;
      for (var i = 0; i < nests.length; i++) {
         var spawn_x = nests[i][0],
             spawn_y = nests[i][1];
         if (spawn_dir == 0)
            spawn_y -= 11;
         if (spawn_dir == 1)
            spawn_x += 11;
         if (spawn_dir == 2)
            spawn_y += 11;
         if (spawn_dir == 3)
            spawn_x -= 11;

         var new_ant = [ spawn_x, spawn_y, spawn_dir ];
         ants.push( new_ant );
      }
   }
}

var randomize = 0;
var RAND_MAX = 23;
var rand_search = 0;
var SEARCH_MAX = 37;

function randTurn()
{
   return Math.floor(Math.random()*4);
}

function searchTurn( x, y )
{
   var sand_dis = Math.abs(player_sandwich[0] - x) + Math.abs( player_sandwich[1] - y );
   var enemy_sand_dis = Math.abs(enemy_sandwich[0] - x) + Math.abs( enemy_sandwich[1] - y );

   var dx, dy;
   if (sand_dis < enemy_sand_dis) {
      dx = player_sandwich[0] - x,
      dy = player_sandwich[1] - y;
   } else {
      dx = enemy_sandwich[0] - x,
      dy = enemy_sandwich[1] - y;
   }

   if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0)
         return 3;
      else
         return 1;
   } else {
      if (dy < 0)
         return 0;
      else
         return 2;
   }
}

function doAntAI( ant )
{
   var x = ant[0], y = ant[1];

   rand_search++;
   if (rand_search >= SEARCH_MAX) {
      rand_search = 0;
      ant[2] = searchTurn( x, y );
      return;
   }

   // Maybe randomly turn
   randomize++;
   if (randomize >= RAND_MAX) {
      randomize = 0;
      ant[2] = randTurn();
      return;
   }

   var dir = ant[2];
   if (dir == 0)
      y -= 1;
   if (dir == 1)
      x += 1;
   if (dir == 2)
      y += 1;
   if (dir == 3)
      x -= 1;

   // Check for Raid or holes in the ground
   var x_grid = Math.floor( x / 10 );
   var y_grid = Math.floor( y / 10 );
   if (raid_grid[x_grid][y_grid] > 0 || geometry[x_grid][y_grid] == 2
         || x <= 0 || y <= 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
      ant[2] = randTurn();
      return;
   }

   ant[0] = x;
   ant[1] = y;
   return;
}

function checkWin( ant )
{
   var x = ant[0],
       y = ant[1];

   if (x >= player_sandwich[0] - 8 && x <= player_sandwich[0] + 8 &&
       y >= player_sandwich[1] - 8 && y <= player_sandwich[1] + 8) {
      victory = -1;
   }
   if (x >= enemy_sandwich[0] - 8 && x <= enemy_sandwich[0] + 8 &&
       y >= enemy_sandwich[1] - 8 && y <= enemy_sandwich[1] + 8) {
      victory = 1;
   }

}

function moveAnts()
{
   for (var j = 0; j < ants.length; j++) {
      doAntAI( ants[j] );
      if (level != 11)
         checkWin( ants[j] );
      if (victory == -1)
         break;
   }
}

function layRaidLine( x, y, length )
{
   for (var k = x; k < x + length; ++k)
      raid_grid[k][y] = 5;
}

function layRaid( x, y )
{
   if (raid_cur == 0)
      return false;

   var x_grid = Math.floor( x / 20 );
   var y_grid = Math.floor( y / 20 );

   if (raid_grid[ x_grid ][ y_grid ] < 50 && geometry[ x_grid ][ y_grid ] == 0) {
      raid_grid[ x_grid ][ y_grid ] = 55;
      raid_cur--;
      return true;
   }
   return false;
}

function degradeRaid()
{
   for (var x = 0; x < RAID_GRID_WIDTH ; ++x) {
      for (var y = 0; y < RAID_GRID_HEIGHT ; ++y) {
         if (raid_grid[x][y] > 0)
            raid_grid[x][y]--;
      }
   }
}

function newGame()
{
   raid_grid = new Array( RAID_GRID_WIDTH );
   for (var i = 0; i < RAID_GRID_WIDTH ; ++i) {
      raid_grid[i] = new Array( RAID_GRID_HEIGHT );
      for (var j = 0; j < RAID_GRID_HEIGHT ; ++j) {
         raid_grid[i][j] = 0;
      }
   }

   geometry = new Array( RAID_GRID_WIDTH );
   for (var i = 0; i < RAID_GRID_WIDTH ; ++i) {
      geometry[i] = new Array( RAID_GRID_HEIGHT );
      for (var j = 0; j < RAID_GRID_HEIGHT ; ++j) {
         geometry[i][j] = 0;
      }
   }
   var pl_sw_x = player_sandwich[0] / 10,
       pl_sw_y = player_sandwich[1] / 10;
   for (var i = pl_sw_x - 2; i < pl_sw_x + 2; ++i) {
      for (var j = pl_sw_y - 2; j < pl_sw_y + 2; ++j) {
         geometry[i][j] = 1;
      }
   }
   var en_sw_x = enemy_sandwich[0] / 10,
       en_sw_y = enemy_sandwich[1] / 10;
   for (var i = en_sw_x - 2; i < en_sw_x + 2; ++i) {
      for (var j = en_sw_y - 2; j < en_sw_y + 2; ++j) {
         geometry[i][j] = 1;
      }
   }

   ants = [];
   spawnAnts();

   victory = 0;
}

var level;

function newGame1() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 100, 180 ], [ 300, 120 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 1;
   newGame();

   level_title.html("Level 1: The Picnic");
}

function newGame2() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 200, 50 ], [ 200, 250 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 2;
   newGame();

   for (var x = 0; x <= 38; x += 2) {
      for (var y = 0; y < RAID_GRID_HEIGHT; y++) {
         geometry[x][y] = 1;
      }
   }

   level_title.html("Level 2: A Striped Blanket");
}

function newGame3() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 60, 210 ], [ 145, 40 ], [ 10, 10 ], [ 205, 185 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 3;
   newGame();

   level_title.html("Level 3: The Swarm");
}

function newGame4() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 200, 150 ], [ 150, 170 ], [ 170, 110 ] ];
   raid_max = 120;
   raid_cur = 120;

   level = 4;
   newGame();

   for (var y = 10; y <= 20; ++y)
      geometry[25][y] = 2;
   for (var x = 15; x <= 25; ++x)
      geometry[x][20] = 2;

   level_title.html("Level 4: Stuck in a Corner");
}

function newGame5() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 100, 150 ] ];
   raid_max = 160;
   raid_cur = 160;

   level = 5;
   newGame();

   level_title.html("Level 5: Surprise Attack");
}

function newGame6()
{
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 60, 210 ], [ 145, 40 ], [ 175, 155 ], [ 20, 155 ], [ 130, 120 ] ];
   raid_max = 120;
   raid_cur = 120;

   level = 6;
   newGame();

   for (var x = 0; x < RAID_GRID_WIDTH; ++x) {
      for (var y = 0; y < RAID_GRID_HEIGHT; ++y) {
         if ((x + y) % 2 == 0)
            geometry[x][y] = 1;
      }
   }

   level_title.html("Level 6: A Plaid Blanket");
}

function newGame7()
{
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 210, 60 ], [ 40, 145 ], [ 155, 205 ], [ 165, 30 ], [ 100, 160 ] ];
   raid_max = 120;
   raid_cur = 120;

   level = 7;
   newGame();

   for (var x = 0; x < RAID_GRID_WIDTH; ++x) {
      for (var y = 0; y < RAID_GRID_HEIGHT; ++y) {
         var v = (3 * y) - (2 * x);
         if ( v > -4 && v < 12)
            geometry[x][y] = 1;
      }
   }

   level_title.html("Level 7: The Highway");
}

function newGame8() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 180, 165 ], [ 210, 160 ], [ 220, 140 ], [ 175, 145 ], [ 195, 130 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 8;
   newGame();

   for (var x = 30; x < RAID_GRID_WIDTH; ++x) {
      for (var y = 20; y < RAID_GRID_HEIGHT; ++y) {
         geometry[x][y] = 1;
      }
   }

   for (var y = 20 ; y < 28; ++y) {
      geometry[29][y] = 2;
   }
   for (var x = 30 ; x < 38; ++x) {
      geometry[x][19] = 2;
   }
   for (var y = 24 ; y < RAID_GRID_HEIGHT; ++y) {
      geometry[32][y] = 2;
   }
   for (var x = 34 ; x < RAID_GRID_WIDTH; ++x) {
      geometry[x][22] = 2;
   }

   level_title.html("Level 8: A Masterful Defense");
}

function newGame9() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 50, 230 ], [ 35, 255 ], [ 65, 255 ] ];
   raid_max = 300;
   raid_cur = 300;

   level = 9;
   newGame();

   for (var y = 8; y < RAID_GRID_HEIGHT; ++y) {
      geometry[10][y] = 2;
      geometry[30][y] = 2;
      geometry[20][y-8] = 2;
   }

   level_title.html("Level 9: The Obstacle Course");
}

function newGame10() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 40, 190 ], [ 210, 35 ], [ 155, 145 ], [ 210, 250 ] ];
   raid_max = 200;
   raid_cur = 200;

   level = 10;
   newGame();

   for (var x = 0; x <= 10; ++x) {
      for (var y = 0; y <= 10; ++y) {
         geometry[x][y] = 1;
      }
   }
   geometry[10][10] = 0;
   geometry[9][10] = 0;
   geometry[10][9] = 0;

   for (var x = 24; x < RAID_GRID_WIDTH; ++x) {
      geometry[x][20] = 2;
   }
   for (var y = 21; y < RAID_GRID_HEIGHT; ++y) {
      if (y != 27)
         geometry[24][y] = 2;
   }
   geometry[23][26] = 2;
   geometry[23][28] = 2;
   for (var x = 24; x < 31; ++x) {
      if (x != 28)
         geometry[x][25] = 2;
   }
   geometry[27][26] = 2;
   geometry[29][26] = 2;
   for (var y = 22; y < RAID_GRID_HEIGHT; ++y) {
      geometry[31][y] = 2;
   }
   for (var x = 27; x < 31; ++x) {
      geometry[x][22] = 2;
   }

   level_title.html("Level 10: The Race to Victory");
}

function gameComplete() {
   player_sandwich = [ 150, 125 ];
   enemy_sandwich = [ 250, 125 ];
   nests = [ [ 200, 220 ], [ 140, 220 ], [ 260, 220 ] ];
   raid_max = 1;
   raid_cur = 0;

   level = 11;
   newGame();

   level_title.html("You are the winner!");
}

function resetLevel() {
   if (level == 1 || level == 21)
      newGame1();
   else if (level == 2 || level == 22)
      newGame2();
   else if (level == 3 || level == 23)
      newGame3();
   else if (level == 4 || level == 24)
      newGame4();
   else if (level == 5 || level == 25)
      newGame5();
   else if (level == 6 || level == 26)
      newGame6();
   else if (level == 7 || level == 27)
      newGame7();
   else if (level == 8 || level == 28)
      newGame8();
   else if (level == 9 || level == 29)
      newGame9();
   else if (level == 10 || level == 30)
      newGame10();
}

// DRAWING ---

function drawGameComplete() {
   context.fillStyle = "black";
   context.fillRect( 128, 198, 544, 94 );
   context.fillStyle = "white";
   context.fillRect( 130, 200, 540, 90 );

   context.font = "48pt sans-serif";
   context.fillStyle = "red";
   context.fillText("Congratulations!", 135, 265);

   context.font = "20pt sans-serif";
   context.fillStyle = "black";
   context.fillText("Play level:", 140, 160);
   for (var l = 1; l <= 10; ++l) {
      var x = 260 + (l * 35);
      context.fillText(l, x, 160);
   }
}

function drawBoard() {
   for (var x = 0; x < RAID_GRID_WIDTH ; ++x) {
      for (var y = 0; y < RAID_GRID_HEIGHT ; ++y) {
         if (raid_grid[x][y] >= 50) {
            context.fillStyle = "rgba(195,195,0,255)";
            context.fillRect( 20*x, 20*y, 20, 20 );
         } else if (raid_grid[x][y] >= 25) {
            context.fillStyle = "rgba(215,215,0,255)";
            context.fillRect( 20*x, 20*y, 20, 20 );
         } else if (raid_grid[x][y] >= 1) {
            context.fillStyle = "rgba(235,235,0,255)";
            context.fillRect( 20*x, 20*y, 20, 20 );
         }

         if (geometry[x][y] == 1) {
            context.fillStyle = "rgba(215,215,215,255)";
            context.fillRect( 20*x, 20*y, 20, 20 );
         } else if (geometry[x][y] == 2) {
            context.fillStyle = "rgba(115,115,115,255)";
            context.fillRect( 20*x, 20*y, 20, 20 );
         }
      }
   }

   context.drawImage( sandwich_img, (2*player_sandwich[0]) - 20, (2*player_sandwich[1]) - 20 );
   context.drawImage( enemy_sandwich_img, (2*enemy_sandwich[0]) - 20, (2*enemy_sandwich[1]) - 20 );

   for (var i = 0; i < nests.length; i++) {
      context.drawImage( anthill_img, (2*nests[i][0]) - 20, (2*nests[i][1]) - 20 );
   }

   context.fillStyle = "rgba(0,0,0,255)";
   for (var j = 0; j < ants.length; j++) {
      context.fillRect( (2*ants[j][0]) - 1, (2*ants[j][1]) - 1, 3, 3 );
   }
}

function drawInterface() {
   context.fillStyle = "rgba(0,0,0,255)";
   context.fillRect( 800, 0, 2, 600 );

   context.fillStyle = "rgba(195,195,0,255)";
   var raid_fill_y = 40 + ( raid_max - raid_cur ) * (560 / raid_max);
   context.fillRect( 802, raid_fill_y, 18, 600 );

   if (muted)
      context.drawImage( muted_img, 800, 0 );
   else
      context.drawImage( notmuted_img, 800, 0 );

   context.drawImage( restart_img, 800, 20 );
}

function clear() {
   context.fillStyle = "rgb(245,245,245)"; 
   context.clearRect( 0, 0, WIDTH + 20, HEIGHT );
   context.fillRect( 0, 0, WIDTH + 20, HEIGHT );
}

function draw() {
   clear();
   drawInterface();
   drawBoard();

   if (level == 11)
      drawGameComplete();
}

function drawLoss() {
   draw();

   context.fillStyle = "black";
   context.fillRect( 158, 203, 484, 154 );
   context.fillStyle = "white";
   context.fillRect( 160, 205, 480, 150 );

   context.font = "48pt sans-serif";
   context.fillStyle = "red";
   context.fillText("My sandwich...", 168, 260);

   context.font = "36pt sans-serif";
   context.fillText("Click to try again", 192, 340);
}

function drawVictory() {
   draw();

   context.fillStyle = "black";
   context.fillRect( 178, 203, 444, 149 );
   context.fillStyle = "white";
   context.fillRect( 180, 205, 440, 145 );

   context.font = "48pt sans-serif";
   context.fillStyle = "red";
   context.fillText("Victory!", 285, 260);
   
   context.font = "36pt sans-serif";
   context.fillText("Click to advance", 205, 340);
}

var clicked = false;

var onMouseMove = function( e ) {
   if (!clicked)
      return;

   var x_pix = e.pageX - canvas.offsetLeft;
   var y_pix = e.pageY - canvas.offsetTop;

   layRaid( x_pix, y_pix );
}

var mouseUp = function( e ) {
   clicked = false;

   can_sound.pause();
   can_sound.currentTime = 0;

   var x_pix = e.pageX - canvas.offsetLeft;
   var y_pix = e.pageY - canvas.offsetTop;
}

var mouseDown = function( e ) {
   clicked = true;

   var x_pix = e.pageX - canvas.offsetLeft;
   var y_pix = e.pageY - canvas.offsetTop;

   var result = layRaid( x_pix, y_pix );

   if (result && !muted) {
      can_sound.currentTime = 0;
      can_sound.play();
   }
}


setInterval(onTimerTick, 33); // 33 ms = ~30 fps

function onTimerTick() {
   ticks++;

   if (ticks == 8000)
      ticks = 800

   if (ticks == 30)
      snd_pianoloop.play();

   if (ticks % 800 == 62) {
      snd_bird3.currentTime = 0;
      snd_bird3.play();
   } else if (ticks % 800 == 243) {
      snd_bird2.currentTime = 0;
      snd_bird2.play();
   } else if (ticks % 800 == 459) {
      snd_bird1.currentTime = 0;
      snd_bird1.play();
   } else if (ticks % 800 == 672) {
      snd_bird5.currentTime = 0;
      snd_bird5.play();
   }

   if (victory == 0) {

      if (ticks % 13 == 0)
         degradeRaid();

      if (ticks % 99 == 0)
         spawnAnts();

      if (ticks % 3 == 0)
         moveAnts();

      draw();
   }
   else if (victory == -1)
   {
      // You lost
      drawLoss();
   }
   else if (victory == 1)
   {
      // You won! 
      drawVictory();
   }
}

var onClick = function( e ) {
   var x_pix = e.pageX - canvas.offsetLeft;
   var y_pix = e.pageY - canvas.offsetTop;

   if (x_pix > 800 && y_pix < 20)
      toggleMute();
   else if (x_pix > 800 && y_pix < 40)
      resetLevel();
   else if (level == 11 &&
         x_pix >= 295 && x_pix <= 645 &&
         y_pix <= 160 && y_pix >= 130) {
      var gotolevel = Math.floor((x_pix - 295) / 35) + 1;
      if (gotolevel < 1) gotolevel = 1;
      if (gotolevel > 10) gotolevel = 10;
      level = gotolevel + 20;
      resetLevel();
      level = gotolevel + 20;
   }
   else if (victory == 1) {
      if (level == 1)
         newGame2();
      else if (level == 2)
         newGame3();
      else if (level == 3)
         newGame4();
      else if (level == 4)
         newGame5();
      else if (level == 5)
         newGame6();
      else if (level == 6)
         newGame7();
      else if (level == 7)
         newGame8();
      else if (level == 8)
         newGame9();
      else if (level == 9)
         newGame10();
      else if (level >= 10)
         gameComplete();
   }
   else if (victory == -1) {
      resetLevel();
   }

}

$('#ants_canvas').mousedown( mouseDown ); 
$('#ants_canvas').mouseup( mouseUp ); 
$('#ants_canvas').mouseout( mouseUp ); 
$('#ants_canvas').mousemove( onMouseMove ); 

$('#ants_canvas').click( onClick ); 

var images_ready = 0;
var total_images = 6;

function addReadyImage() {
   images_ready++;
   if (images_ready == total_images) {
      newGame1();
      draw();
   }
}

sandwich_img.onload = addReadyImage;
sandwich_img.src = 'sandwich.png';
enemy_sandwich_img.onload = addReadyImage;
enemy_sandwich_img.src = 'enemy_sandwich.png';
anthill_img.onload = addReadyImage;
anthill_img.src = 'anthill.png';
muted_img.onload = addReadyImage;
muted_img.src = 'Muted.png';
notmuted_img.onload = addReadyImage;
notmuted_img.src = 'NotMuted.png';
restart_img.onload = addReadyImage;
restart_img.src = 'Restart.png';
