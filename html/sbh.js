window.addEventListener("load", () => {
    "use strict";

    class Actor {
        constructor(container) {
            this.element = document.createElement("div");
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
            return true;
        }

        die() {
            this.element.parentElement.removeChild(this.element);
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
            super(enemies);
            this.content = "👾";
            this.element.setAttribute("class", "alive");

            this.healthBar = new HealthBar(this.element, 100);

            this.x = Math.random()*(arena.clientWidth - this.width);
            this.y = Math.random()*(arena.clientHeight/2 - this.height);

            this.hurting = false;
            this.element.addEventListener("mouseover", () => this.hurting = true);
            this.element.addEventListener("mouseout", () => this.hurting = false);
        }

        update(dt) {
            this.x += (Math.random() - Math.random())*dt/10;
            this.y += (Math.random() - Math.random())*dt/10;

            if (this.hurting) {
                this.healthBar.value -= dt/10;
                if (this.healthBar.value <= 0) {
                    this.content = "💥";
                    this.element.setAttribute("class", "exploding");
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
            console.log(lastSpawn);
            actors.push(new Enemy());
            lastSpawn = 0;
        }

        actors.filter(actor => actor.update(dt));
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
