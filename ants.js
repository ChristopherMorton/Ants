var canvas = $('#ants_canvas')[0]
var context = canvas.getContext('2d');
//var can_sound = new Audio('canwhistle.ogg');
var snd_bird1 = new Audio('Bird1.ogg');
var snd_bird2 = new Audio('Bird2.ogg');
var snd_bird3 = new Audio('Bird3.ogg');
var snd_bird5 = new Audio('Bird5.ogg');

var WIDTH = 800, HEIGHT = 600;
var GRID_WIDTH = 400, GRID_HEIGHT = 300;
var RAID_GRID_WIDTH = 40, RAID_GRID_HEIGHT = 30;
var MAX_ANTS = 200;

var sandwich_img = new Image();
var enemy_sandwich_img = new Image();
var anthill_img = new Image();

var player_sandwich,
    enemy_sandwich,
    geometry,
    nests,
    ants,
    raid_grid;

var victory;

var raid_max;
var raid_cur;

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
   if (raid_grid[x_grid][y_grid] > 0 || geometry[x_grid][y_grid] == 2) {
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
      return;

   var x_grid = Math.floor( x / 20 );
   var y_grid = Math.floor( y / 20 );

   if (raid_grid[ x_grid ][ y_grid ] < 50 && geometry[ x_grid ][ y_grid ] == 0) {
      raid_grid[ x_grid ][ y_grid ] = 55;
      raid_cur--;
   }
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
   nests = [ [ 200, 150 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 1;
   newGame();
}

function newGame2() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 100, 180 ], [ 300, 120 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 2;
   newGame();
}

function newGame3() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 60, 210 ], [ 145, 40 ], [ 10, 10 ], [ 205, 185 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 3;
   newGame();
}

function newGame4() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 200, 150 ] ];
   raid_max = 100;
   raid_cur = 100;

   level = 4;
   newGame();

   for (var y = 10; y <= 20; ++y)
      geometry[25][y] = 2;
   for (var x = 15; x <= 25; ++x)
      geometry[x][20] = 2;
}

function newGame5() {
   player_sandwich = [ 50, 50 ];
   enemy_sandwich = [ 350, 250 ];
   nests = [ [ 100, 150 ] ];
   raid_max = 150;
   raid_cur = 150;

   level = 5;
   newGame();
}

// DRAWING ---

function drawBoard() {
   /*
   for (var x = 0; x < GRID_WIDTH ; ++x) {
      for (var y = 0; y < GRID_HEIGHT ; ++y) {
         if (raid_grid[x][y] == 5)
            context.putImageData( raid_pix_5, x, y ); 
         else if (raid_grid[x][y] == 4)
            context.putImageData( raid_pix_4, x, y ); 
         else if (raid_grid[x][y] == 3)
            context.putImageData( raid_pix_3, x, y ); 
         else if (raid_grid[x][y] == 2)
            context.putImageData( raid_pix_2, x, y ); 
         else if (raid_grid[x][y] == 1)
            context.putImageData( raid_pix_1, x, y ); 
      }
   }
   */
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
   var raid_fill_y = ( raid_max - raid_cur ) * (600 / raid_max);
   context.fillRect( 802, raid_fill_y, 18, 600 );
}

function clear() {
   context.fillStyle = "rgb(245,245,245)"; 
   context.clearRect( 0, 0, WIDTH + 20, HEIGHT );
   context.fillRect( 0, 0, WIDTH + 20, HEIGHT );
}

function draw() { 
   clear();
   drawBoard();
   drawInterface();
}

function drawLoss() {
   draw();
   context.font = "48pt sans-serif";
   context.fillStyle = "red";
   context.fillText("You Lose...", 200, 260);
}

function drawVictory() {
   draw();
   context.font = "48pt sans-serif";
   context.fillStyle = "red";
   context.fillText("You Win!", 230, 260);
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

   //can_sound.pause();
   //can_sound.currentTime = 0;

   var x_pix = e.pageX - canvas.offsetLeft;
   var y_pix = e.pageY - canvas.offsetTop;
}

var mouseDown = function( e ) {
   clicked = true;

   //if (raid_cur != 0) {
      //can_sound.currentTime = 0;
      //can_sound.play();
   //}

   var x_pix = e.pageX - canvas.offsetLeft;
   var y_pix = e.pageY - canvas.offsetTop;

   layRaid( x_pix, y_pix );
}

var ticks = 0;

setInterval(onTimerTick, 33); // 33 milliseconds = ~ 30 frames per sec

function onTimerTick() {
   ticks++;

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
   if (victory == 1) {
      if (level == 1)
         newGame2();
      else if (level == 2)
         newGame3();
      else if (level == 3)
         newGame4();
      else if (level == 4)
         newGame5();
      else if (level == 5)
         newGame5();
   }
   else if (victory == -1) {
      if (level == 1)
         newGame1();
      else if (level == 2)
         newGame2();
      else if (level == 3)
         newGame3();
      else if (level == 4)
         newGame4();
      else if (level == 5)
         newGame5();
   }
}

$('#ants_canvas').mousedown( mouseDown ); 
$('#ants_canvas').mouseup( mouseUp ); 
$('#ants_canvas').mouseout( mouseUp ); 
$('#ants_canvas').mousemove( onMouseMove ); 

$('#ants_canvas').click( onClick ); 

var images_ready = 0;
var total_images = 3;

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
