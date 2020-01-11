window.addEventListener("load", () => {
    "use strict";

    var score = 0;

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
            this.value = maxVal;
            this.maxVal = maxVal;
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
        }

        update(dt) {
            this.x += (Math.random() - Math.random())*dt*this.size/1000;
            this.y += (Math.random() - Math.random())*dt*this.size/1000;

            if (this.hurting) {
                score += dt;
                this.healthBar.value -= dt/10;
                if (this.healthBar.value <= 0) {
                    score += Math.floor(this.healthBar.maxVal);
                    this.content = "💥";
                    this.element.setAttribute("class", "exploding");
                    this.element.style.setProperty("font-size", (this.size*5) + '%');
                    this.element.addEventListener("transitionend", () => this.die());
                    return false;
                }
            }

            return super.update();
        }
    }

    var arena = document.getElementById("arena");
    var hp = document.getElementById("hp");
    var enemies = document.getElementById("enemies");
    var bullets = document.getElementById("bullets");
    var actors = [];

    var health = new HealthBar(arena, 100);

    var lastSpawn = 0;
    function update(dt) {
        lastSpawn += dt;
        if (lastSpawn > 1000) {
            actors.push(new Enemy());
            lastSpawn = 0;
        }

        actors = actors.filter(actor => actor.update(dt));
        document.getElementById("score").innerText = score;
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
