let STANDING = 0;
let WALKING = 1;
let RUNNING = 2;
let DOOR_CLOSED = 0;
let DOOR_EXIT = 1;
let img_standing, img_walking, img_running, img_door_closed, img_door_exit, img_hourglass, img_crossmark, img_timemachine;
let drawing_width = 400;
let drawing_height = 400;

class Position {
  constructor(x=0,y=0,z=0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Person {
  constructor(id, position=null, height=50, width=50) {
    this.id = id;
    if (position == null) position = new Position();
    this.position = position;
    this.height = height;
    this.width = width;
    this.drawable = true;
    this.state = STANDING;
    this.direction = new Position(1,0,0);
    this.text = str(this.id);
    this.msg = '';
    this.GL = null;

    this.images = [img_standing, img_walking, img_running];
  }

  draw() {
    if (this.drawable == true) {
      push();
      // scale(-1.0, 1.0);
      imageMode(CENTER);
      image(this.images[this.state], this.position.x, this.position.y - this.height/2 + this.height/10, this.width, this.height);
      fill(50);
      text(str(this.id)+this.msg, this.position.x, this.position.y - this.height*11/10, 50, 50);
      pop();
    }
  }

  update() {
  }

  use() {
    this.GL.use();
  }
}

class GameLevel {
  constructor(width=0, height=0) {
    this.width = width;
    this.height = height;
    this.position = new Position();
    this.camera_position = new Position(this.width/2, this.height/2);
    this.drawable = true;
    this.objects = [];
    this.strangers = [];
    this.slide_num = 0;
    this.helped = false;
    this.slide_helped = 0;
    this.id_helped = [0,0];
    this.time_tick_support = 0;
    this.progress_direction = 1;
    this.animations = [];

    // this.timeline = new Timeline(new Position(this.width/2, this.height*1/4));
    // this.add_object(this.timeline);
    this.sun = new Sun(new Position(this.width/2, this.height/2));
    this.sun.GL = this;
    this.add_object(this.sun);
    this.first_floor = new Floor(new Position(0, this.height*3/4), new Position(this.width*3, this.height*3/4));
    this.add_object(this.first_floor);
    this.second_floor = new Floor(new Position(0, this.height*3/5), new Position(this.width*3, this.height*3/5));
    this.add_object(this.second_floor);
    this.door = new Door(new Position(this.width/4, this.second_floor.position0.y));
    this.add_object(this.door);
    this.player = new Person(this.strangers.length, new Position(this.width/2, this.height*3/4));
    this.add_object(this.player);
    this.player.GL = this;
    this.time_machine = null;
  }

  add_object(obj) {
    this.objects.push(obj);
  }

  draw() {
    if (this.drawable == true) {
      push();
      translate(this.position.x, this.position.y);
      background(220);
      this.objects.forEach(obj => {
        obj.draw();
      });
      pop();
    }
  }

  update() {
    if (this.player.position.x >= this.width) {
      this.go_right();
    }
    else if (this.player.position.x < 0) {
      this.go_left();
    }
    this.objects.forEach(obj => {
      obj.update();
    });
  }

  go_right(){
    this.slide_num += 1;

    if (this.helped == false && this.slide_num > 3 && (random() < 0.3 || this.slide_num > 5)) {
      this.helped = true;
      this.slide_helped = this.slide_num - 1;
      this.id_helped = [this.strangers[random(int(0, this.slide_num-3))].id, this.strangers[this.slide_num-2].id];
      console.log(this.id_helped);
      this.strangers[this.slide_num-2].position.y = this.second_floor.position0.y;
      this.strangers[this.slide_num-2].msg = ': Thx!';
      this.strangers.forEach(obj => {
        if (obj.id < this.slide_num-1) {
          obj.position.x = this.player.position.x - this.player.position.x/10 - obj.id * this.player.position.x / this.strangers.length ;
          obj.msg = ': OOO!';
        }
      });
      if (this.helped == true && this.time_machine == null) {
        this.time_machine = new Timemachine(new Position(this.width*3/4 + this.width*(this.slide_helped - this.slide_num + 2), this.first_floor.position0.y));
        this.add_object(this.time_machine);
      }
      this.time_machine.charged = true;
    }

    if (this.helped == false && this.strangers.length < this.slide_num) {
      this.strangers.forEach(obj => {
        obj.position.x = -this.width;
      });

      let stranger = new Person(this.strangers.length + 1, new Position(this.width*3/4 + this.width, this.first_floor.position0.y));
      stranger.msg = ': Help!';
      this.add_object(stranger);
      this.strangers.push(stranger);
      // console.log(this.strangers.length);
    }
    if (this.player.id >= 0) {
      this.player.msg = "";
    }
    this.door.position.x -= this.width;
    if (this.time_machine != null) this.time_machine.position.x -= this.width;
    this.player.position.x -= this.width;
    this.strangers.forEach(obj => {
      obj.position.x -= this.width;
    });

    if (this.progress_direction == 1) {
      this.time_tick_support += 1;
      if (this.sun.time < this.time_tick_support) {
        this.sun.launch_animation(this.sun.time, this.sun.time + 1, 0.5);
      }
    }
    else {
      this.time_tick_support -= 1;
    }
  }

  go_left(){
    this.slide_num -= 1;
    this.door.position.x += this.width;
    if (this.time_machine != null) this.time_machine.position.x += this.width;
    this.player.position.x += this.width;
    if (this.player.id > 0 && this.player.id == this.slide_num) {
      this.player.msg = ": Help!";
    }
    else {
      this.player.msg = "";
    }
    this.strangers.forEach(obj => {
      obj.position.x += this.width;
    });

    if (this.progress_direction == -1) {
      this.time_tick_support += 1;
      if (this.sun.time < this.time_tick_support) {
        this.sun.launch_animation(this.sun.time, this.sun.time + 1, 0.5);
      }
    }
    else {
      this.time_tick_support -= 1;
    }
  }

  use() {
    if (this.helped == false && this.near() == true && this.slide_num != 0) {
      // help
      this.helped = true;
      this.slide_helped = this.slide_num;
      this.id_helped = [this.player.id, this.strangers[this.slide_num-1].id];
      console.log(this.id_helped);
      this.strangers[this.slide_num-1].position.y = this.second_floor.position0.y;
      this.strangers[this.slide_num-1].msg = ': Thx!';
      this.strangers.forEach(obj => {
        if (obj.id < this.slide_num) {
          obj.position.x = this.player.position.x - this.player.position.x/10 - obj.id * this.player.position.x / this.strangers.length ;
          obj.msg = ': OOO!';
        }
      });
      this.player.msg = ": OOO!";
      if (this.helped == true && this.time_machine == null) {
        this.time_machine = new Timemachine(new Position(this.width*3/4 + this.width*(this.slide_helped - this.slide_num + 1), this.first_floor.position0.y));
        this.add_object(this.time_machine);
      }
      this.time_machine.charged = true;

    }
    else if (this.slide_num == (this.slide_helped + 1)) {
      // time travel
      if (this.near() == true && this.time_machine.charged == true) {
        this.timetravel();
      }
    }
    else if (this.helped == true && this.slide_num == this.slide_helped && this.player.id == this.id_helped[1] && this.near() == true) {
      // receive help
      this.player.position.y = this.second_floor.position0.y;
      this.player.msg = ': Thx!';
      this.strangers.forEach(obj => {
        if (obj.id == this.id_helped[0]) {
          obj.position.x = this.player.position.x - this.player.width;
          obj.msg = ': OOO!';
        }
        else if (obj.id < this.id_helped[0]) {
          obj.position.x = this.slide_helped * this.width + this.width * 2 + this.width / 2;
          obj.msg = '';
        }
        else if (obj.id < this.id_helped[1]) {
          obj.position.x = this.player.position.x - this.player.position.x/10 - obj.id * this.player.position.x / this.strangers.length ;
          obj.msg = ': OOO!';
        }
      });
    }
    else if (this.helped == true && this.slide_num == 0 && this.player.id != 0 && this.player.position.y == this.second_floor.position0.y && this.near() == true) {
      // escape through door
      this.player.position.y = this.first_floor.position0.y;
      this.player.position.x = this.width/2;
      this.player.msg = ': Done!';
      this.door.drawable = false;
      this.second_floor.drawable = false;
      this.strangers.forEach(obj => {
        obj.drawable = false;
      });
    }
    else if (this.helped == true && this.slide_num < this.slide_helped && this.player.id == this.slide_num && this.near() == true) {
      // not receive help and look on younger you running away
      this.strangers.forEach(obj => {
        if (this.player.id < this.id_helped[0]) {
          obj.position.x = this.slide_helped * this.width + this.width * 2 + this.width / 2;
          obj.msg = '';
        }
        else if (obj.id == this.id_helped[1]) {
          obj.position.x = this.width * (this.slide_helped - this.slide_num) + this.width * 3/4 ;
          obj.position.y = this.first_floor.position0.y;
          obj.msg = ': Help!';
        }
        else if (obj.id >= this.id_helped[0]) {
            obj.position.x = this.width * (this.slide_helped - this.slide_num) + this.width * 3/4 - (this.width * 3/4)/10 - obj.id * (this.width * 3/4) / this.strangers.length ;
            obj.msg = '';
        }
        else {
            obj.position.x = this.slide_helped * this.width + this.width * 2 + this.width / 2;
            obj.msg = '';
        }
      });

      this.progress_direction = 1;
    }
    else if (this.helped == true && this.slide_num == this.slide_helped && this.id_helped[1] != this.player.id && 0 < this.strangers[this.slide_num-1].position.x < this.width) {
      // witness help
      this.strangers[this.slide_num-1].position.y = this.second_floor.position0.y;
      this.strangers[this.slide_num-1].msg = ': Thx!';
      this.strangers.forEach(obj => {
        if (obj.id < this.id_helped[1]) {
          obj.msg = ': OOO!';
        }
      });
      this.player.msg = ': OOO!';
      this.time_machine.charged = true;
    }

    console.log("time:" + str(this.sun.time))
  }

  timetravel() {
    console.log('timetravel');
    this.player.id += 1;
    this.strangers.forEach(obj => {
      if (obj.id == this.player.id) {
        obj.id -= 1;
      }
      obj.position.x = this.player.position.x + this.width;
      obj.position.y = this.first_floor.position0.y;
      obj.msg = '';
      
      if (obj.id == 0) {
        obj.position.x = this.width*1/4 - this.width * (this.slide_helped - this.player.id + 1) ;
        obj.position.y = this.first_floor.position0.y;
      }
    });
    this.time_machine.charged = false;

    this.progress_direction = -1;
    this.time_tick_support = - (this.sun.time - this.player.id) + 1;
    this.sun.launch_animation(this.sun.time, - (this.sun.time - this.player.id) + 1, 0.5);
    this.time_machine.launch_animation();
  }

  near() {
    if (this.helped == true && this.slide_num == (this.slide_helped + 1) && abs(this.player.position.x - this.time_machine.position.x) < this.time_machine.width/2
        && abs(this.player.position.y - this.time_machine.position.y < this.time_machine.height/5)){
      return true;
    }
    else if (this.slide_num == 0 && abs(this.player.position.x - this.door.position.x) < this.door.width / 2 && abs(this.player.position.y - this.door.position.y) < this.door.height / 5) {
      return true;
    }
    else {
      for (let obj of this.strangers) {
        if (abs(obj.position.x - this.player.position.x) < this.width / 5 && abs(obj.position.y - this.player.position.y) < this.height / 10) {
          return true;
        }
      }
    }
  }
}

class Floor {
  constructor(position0=null, position1=null) {
    if (position0 == null) position0 = new Position();
    if (position1 == null) position1 = position0;
    this.position0 = position0;
    this.position1 = position1;
    this.drawable = true;
  }

  draw() {
    if (this.drawable == true) {
      push();
      // translate(this.position0.x, this.position0.y);
      line(this.position0.x, this.position0.y, this.position1.x, this.position1.y);
      pop();
    }
  }

  update() {
  }
}

class Door {
  constructor(position=null, height=50, width=50) {
    if (position == null) position = new Position();
    this.position = position;
    this.height = height;
    this.width = width;
    this.drawable = true;
    this.images = [img_door_closed, img_door_exit];
    this.state = DOOR_CLOSED;    
  }

  draw() {
    if (this.drawable == true) {
      push();
      imageMode(CENTER);
      image(this.images[this.state], this.position.x, this.position.y - this.height/2 + this.height/10, this.width, this.height);
      pop();
    }
  }

  update() {
  }
}

class Timemachine {
  constructor(position=null, height=50, width=50) {
    if (position == null) position = new Position();
    this.position = position;
    this.height = height;
    this.width = width;
    this.drawable = true;
    this.images = [img_timemachine];
    this.charged = true;
    
    this.animation_in_progress = false;
    this.animation_start = 0;
    this.animation_end = 0;
    this.animation_duration = 1;
    this.animation_checkpoint = -1;
    this.wave = 0;
  }

  launch_animation(duration=0.5) {
    this.animation_in_progress = true;
    this.animation_start = 0;
    this.animation_end = drawing_width*3;
    this.animation_duration = duration;
  }

  draw() {
    if (this.drawable == true) {
      push();
      rectMode(CENTER);
      fill(255, 0, 0);
      rect(this.position.x, this.position.y - this.height/2, this.width, this.height);
      imageMode(CENTER);
      image(this.images[0], this.position.x, this.position.y - this.height/2, this.width, this.height);
      if (this.wave != 0) {
        ellipseMode(CENTER);
        stroke(255);
        noFill();
        circle(this.position.x, this.position.y - this.height/2, this.wave);
      }
      pop();
    }
  }

  update() {
    if (this.animation_in_progress == true) {
      if (this.animation_checkpoint == -1) {
        this.animation_checkpoint = millis();
      }
      let checkpoint = millis()
      this.wave = this.animation_start + (this.animation_end - this.animation_start) * (checkpoint - this.animation_checkpoint) / 1000.0 / this.animation_duration;
      need_redraw = true;
      if (((checkpoint - this.animation_checkpoint) / 1000.0 / this.animation_duration) >= 1) {
        // console.log(checkpoint);
        this.wave = 0;
        this.animation_in_progress = false;
        this.animation_checkpoint = -1;
      }
    }
  }
}

class Timeline {
  constructor(position=null, height=30, width=30) {
    if (position == null) position = new Position();
    this.position = position;
    this.height = height;
    this.width = width;
    this.drawable = true;
    this.images = [img_hourglass, img_crossmark];
    this.timestamp = 0;
    this.crosses = [];
    this.start = -(drawing_width*3/4)*(1/2);
    this.end = (drawing_width*3/4)*(1/2);
  }

  draw() {
    if (this.drawable == true) {
      push();
      translate(this.position.x, this.position.y);
      line(this.start, 0, this.end, 0);
      imageMode(CENTER);
      image(this.images[0], this.timestamp * (this.end-this.start) + this.start, 0, this.width, this.height);
      this.crosses.forEach(cross => {
        image(this.images[1], this.position.x, this.position.y - this.height/2 + this.height/10, this.width, this.height);
      });
      pop();
    }
  }

  update() {
  }
}

class Sun {
  constructor(position=null, height=30, width=30) {
    if (position == null) position = new Position(drawing_width/4, drawing_height/4);
    this.position = position;
    this.height = height;
    this.width = width;
    this.drawable = true;
    this.time = 0;
    this.GL = null;
    
    this.time_animation_in_progress = false;
    this.time_animation_start = 0;
    this.time_animation_end = 0;
    this.time_animation_duration = 1;
    this.time_animation_checkpoint = -1;
  }

  launch_animation(start=0, end=0, duration=0.0) {
    this.time_animation_in_progress = true;
    this.time_animation_start = start;
    this.time_animation_end = end;
    this.time_animation_duration = duration;
  }

  draw() {
    if (this.drawable == true) {
      push();
      translate(this.position.x, this.position.y);
      push();
      rotate(this.time * PI / 3.0);
      ellipseMode(CENTER); 
      fill('orange');
      noStroke();
      circle(-this.GL.width/3*cos(PI/6.0),-this.GL.height/3*sin(PI/6.0),this.width);
      push();
      translate(this.GL.width/3*cos(PI/6.0), this.GL.height/3*sin(PI/6.0));
      rotate(-this.time * PI / 3.0 - PI/4);
      fill('white');
      noStroke();
      circle(0, 0,this.width);
      fill(220);
      circle(this.width/3, this.width/3, this.width);
      // stroke(0);
      // line(0,0,this.width/3, this.width/3);
      pop();
      pop();
      rectMode(CORNERS);
      fill(220);
      noStroke();
      rect(-this.GL.width,0, this.GL.width, this.GL.height);
      pop();
    }
  }

  update() {
    if (this.time_animation_in_progress == true) {
      if (this.time_animation_checkpoint == -1) {
        this.time_animation_checkpoint = millis();
      }
      let checkpoint = millis()
      this.time = this.time_animation_start + (this.time_animation_end - this.time_animation_start) * (checkpoint - this.time_animation_checkpoint) / 1000.0 / this.time_animation_duration;
      need_redraw = true;
      if (((checkpoint - this.time_animation_checkpoint) / 1000.0 / this.time_animation_duration) >= 1) {
        // console.log(checkpoint);
        this.time = this.time_animation_end;
        this.time_animation_in_progress = false;
        this.time_animation_checkpoint = -1;
      }
    }
  }
}

function preload() {
  // preload() runs once
  img_standing = loadImage('assets/1F9CD.svg');
  img_walking = loadImage('assets/1F3C3.svg');
  img_running = loadImage('assets/1F6B6.svg');
  img_door_closed = loadImage('assets/1F6AA.svg');
  img_door_exit = loadImage('assets/E0A8.svg');
  img_hourglass = loadImage('assets/231B.svg');
  img_crossmark = loadImage('assets/274C.svg');
  img_timemachine = loadImage('assets/1F504.svg');
}

let GL;
let need_redraw = false;

function setup() {
  // put setup code here
  createCanvas(drawing_width, drawing_height);
  GL = new GameLevel(drawing_width, drawing_height);
  
  
  background(220);
  GL.draw();

}

function draw() {
  // put drawing code here
  if (need_redraw == true) {
    need_redraw = false;
    GL.draw();
  }
    
  GL.update();
}

function keyPressed() {
  if (key == 'e' || key == 'h' || keyCode == 32 || keyCode == ENTER) {
    GL.player.use();
  }
  if (keyCode === LEFT_ARROW) {
    if (GL.slide_num != 0 || GL.player.position.x > 20) {
      GL.player.position.x -= 50;
    }
  } else if (keyCode === RIGHT_ARROW) {
    if (GL.helped == false || GL.helped == true && !(GL.slide_num == (GL.slide_helped + 1) && GL.player.position.x >= (GL.width - GL.player.width) || GL.slide_num == GL.slide_helped && GL.player.id == GL.id_helped[0] && GL.strangers[GL.slide_helped-1].position.y != GL.second_floor.position0.y && GL.player.position.x >= (GL.width - GL.player.width))) {
      GL.player.position.x += 50;
    }
  }

  need_redraw = true;
}

function touchStarted() {
  console.log(touches.length + ' touches');
  if (touches.length == 0) {
    if (mouseX > drawing_width/4 && mouseX < drawing_width*3/4) {
      GL.player.use();
    }
    else if (mouseX < drawing_width/4) {
      if (GL.slide_num != 0 || GL.player.position.x > 20) {
        GL.player.position.x -= 50;
      }
    } 
    else if (mouseX > drawing_width*3/4) {
      if (GL.helped == false || GL.helped == true && !(GL.slide_num == (GL.slide_helped + 1) && GL.player.position.x >= (GL.width - GL.player.width) || GL.slide_num == GL.slide_helped && GL.player.id == GL.id_helped[0] && GL.strangers[GL.slide_helped-1].position.y != GL.second_floor.position0.y && GL.player.position.x >= (GL.width - GL.player.width))) {
        GL.player.position.x += 50;
      }
    }
  
    need_redraw = true;
  }
}
