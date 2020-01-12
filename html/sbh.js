window.addEventListener("load", () => {
    "use strict";

    var game;
    var arena = document.getElementById("arena");
    var enemies = document.getElementById("enemies");
    var bullets = document.getElementById("bullets");
    var score = document.getElementById("score");

    arena.addEventListener("mousemove", e => {
        if (game) {
            game.mx = e.clientX;
            game.my = e.clientY;
        }
    });

    function onKill() {
        game.killed++;
        game.spawns.push(new Enemy());
        if (game.killed % 5 == 0) {
            game.spawns.push(new Enemy());
        }
        if (game.killed % 9 == 0) {
            game.spawns.push(new Bee());
        }
    }

    class Actor {
        constructor(element, container) {
            this.element = document.createElement(element);
            container.appendChild(this.element);
            this.x = 0;
            this.y = 0;
        }

        get content() {
            return this.element.innerText;
        }

        set content(text) {
            this.element.innerText = text;
        }

        get width() {
            return this.element.clientWidth;
        }

        get height() {
            return this.element.clientHeight;
        }

        update(dt) {
            var style = this.element.style;
            style.setProperty('left', Math.floor(this.x) + 'px');
            style.setProperty('top', Math.floor(this.y) + 'px');

            // despawn enemies as soon as they leave the screen
            if (this.x > arena.clientWidth || this.x + this.width < 0 ||
                this.y > arena.clientHeight || this.y + this.height < 0) {
                this.die();
                return false;
            }

            return true;
        }

        die() {
            if (this.element.parentElement) {
                this.element.parentElement.removeChild(this.element);
            }
        }
    }

    class HealthBar {
        constructor(parent, maxVal) {
            this.element = document.createElement("div");
            this.element.setAttribute("class", "healthBar");
            parent.appendChild(this.element);
            this.maxVal = maxVal;
            this.value = maxVal;
        }

        get value() {
            return this._value;
        }

        set value(val) {
            this._value = val;

            var level = val*100.0/this.maxVal;

            this.element.style.setProperty('width', level + '%');
            if (level > 50) {
                this.element.setAttribute("class", "healthBar full");
            } else if (level > 25) {
                this.element.setAttribute("class", "healthBar medium");
            } else if (level > 0) {
                this.element.setAttribute("class", "healthBar low");
            } else {
                this.element.setAttribute("class", "healthBar empty");
            }
        }
    }

    class Bullet extends Actor {
        constructor(x, y, dx, dy, adjust) {
            super("li", bullets);
            this.x = x + dx*adjust;
            this.y = y + dy*adjust;
            this.dx = dx;
            this.dy = dy;

            this.element.addEventListener("mouseover", () => game.health.value--);
            this.update(0);
        }

        update(dt) {
            this.x += this.dx*dt;
            this.y += this.dy*dt;
            return super.update(dt);
        }
    }

    class Enemy extends Actor {
        constructor() {
            super("div", enemies);
            this.content = "👾";
            this.element.setAttribute("class", "alive");

            this.size = (Math.random()*3 + 1)*100;
            this.element.style.setProperty("font-size", this.size + '%')
            this.healthBar = new HealthBar(this.element, this.size);

            this.x = Math.random()*(arena.clientWidth - this.width) + this.width/2;
            this.y = Math.random()*(arena.clientHeight/2 - this.height) + this.height/2;

            this.hurting = false;
            this.element.addEventListener("mouseover", () => this.hurting = true);
            this.element.addEventListener("mouseout", () => this.hurting = false);

            this.shootAngle = Math.random()*2*Math.PI;
            this.shootAngleInc = Math.random()*2*Math.PI;
            this.shootFreq = Math.random()*50 + 20;
            this.shootVelocity = Math.random()*0.5 + 0.05;

            this.nextShot = Math.random()*1000 + 100;
        }

        update(dt) {
            this.x += (Math.random() - Math.random())*dt*this.size/1000;
            this.y += (Math.random() - Math.random())*dt*this.size/1000;

            if (this.hurting) {
                game.score += Math.floor(dt*this.size);
                this.healthBar.value -= dt/10;
                if (this.healthBar.value <= 0) {
                    game.score += Math.floor(this.healthBar.maxVal*10);
                    this.content = "💥";
                    this.element.setAttribute("class", "exploding");
                    this.element.style.setProperty("font-size", (this.size*5) + '%');
                    this.element.addEventListener("transitionend", () => this.die());
                    onKill();
                    return false;
                }
            } else {
                this.nextShot -= dt;
                while (this.nextShot <= 0) {

                    var dx = this.shootVelocity*Math.sin(this.shootAngle);
                    var dy = this.shootVelocity*Math.cos(this.shootAngle);
                    game.spawns.push(new Bullet(
                        this.x,
                        this.y,
                        dx,
                        dy,
                        this.nextShot));
                    this.shootAngle += this.shootAngleInc;

                    this.nextShot += this.shootFreq;
                }
            }

            return super.update(dt);
        }
    }

    class Bee extends Actor {
        constructor() {
            super("div", enemies);
            this.content = "🐝";
            this.element.setAttribute("class", "alive");

            this.size = (Math.random() + 1)*Math.min(arena.clientWidth/4, arena.clientHeight/8);
            this.element.style.setProperty("font-size", this.size + 'px');
            this.healthBar = new HealthBar(this.element, this.size*3);

            this.x = this.cx = Math.random()*arena.clientWidth/10 + arena.clientWidth/2;
            this.y = this.cy = Math.random()*arena.clientHeight/10 + arena.clientHeight/4;

            this.hurting = false;
            this.element.addEventListener("mouseover", () => this.hurting = true);
            this.element.addEventListener("mouseout", () => this.hurting = false);

            this.phase = Math.random()*Math.PI*2;
            this.freqX = Math.random()*0.001 + 0.001;
            this.freqY = Math.random()*0.001 + 0.001;
            this.dx = Math.random()*Math.min(this.x, arena.clientWidth - this.cx) - this.size/3;
            this.dy = Math.random()*Math.min(this.y, arena.clientHeight - this.cy) - this.size/3;

            this.shootFreq = Math.random()*30 + 20;
            this.shootVelocity = Math.random()*0.5 + 0.07;
            this.nextShot = Math.random()*1000 + 100;
        }

        update(dt) {
            this.phase += dt;
            this.x = this.cx + Math.sin(this.phase*this.freqX)*this.dx;
            this.y = this.cy + Math.sin(this.phase*this.freqY)*this.dy;

            if (this.hurting) {
                this.x += (Math.random() - Math.random())*20;
                this.y += (Math.random() - Math.random())*20;
                game.score += Math.floor(dt*this.size);
                this.healthBar.value -= dt/10;
                if (this.healthBar.value <= 0) {
                    game.score += Math.floor(this.healthBar.maxVal*10);
                    this.content = "💥";
                    this.element.setAttribute("class", "exploding");
                    this.element.style.setProperty("font-size", (this.size*5) + '%');
                    this.element.addEventListener("transitionend", () => this.die());
                    for (var i = 0; i < 3; i++) {
                        onKill();
                    }
                    return false;
                }
            } else {
                this.nextShot -= dt;
                while (this.nextShot <= 0) {
                    var ox = game.mx - this.x;
                    var oy = game.my - this.y;
                    var len = Math.sqrt(ox*ox + oy*oy);
                    game.spawns.push(new Bullet(
                        this.x,
                        this.y,
                        ox*this.shootVelocity/len,
                        oy*this.shootVelocity/len,
                        this.nextShot));
                    this.nextShot += this.shootFreq;
                }
            }

            return super.update(dt);
        }
    }


    game = {
        score: 0,
        health: new HealthBar(arena, 1000),
        spawns: [],
        actors: [],
        killed: 0,
    };

    function update(dt) {
        if (game.health.value <= 0) {
            return;
        }

        game.spawns.forEach(spawn => game.actors.push(spawn));
        game.spawns = []

        if (game.actors.length < 1) {
            game.actors.push(new Enemy());
        }

        game.actors = game.actors.filter(actor => actor.update(dt));
        score.innerText = game.score;
    }

    var lastTime = new Date();
    function frame() {
        var now = new Date();
        update(now - lastTime);

        lastTime = now;
        (window.requestAnimationFrame || window.setTimeout)(frame, 1000.0/30);
    }

    frame();
});
