$(function () {

    var width, height, canvas, ctx, points, target;
    var lineLen = 50;
    var heartBeatCD = 3000;
    var heartBeatRange = 300;
    var intersections = [];
    var rgb = "156,217,249";

    // Main
    initHeader();
    initAnimation();
    addListeners();



    function initHeader() {

        canvas = document.getElementById("reactive-bg-canvas");
        width = $(document).width();
        height = $(document).height();
        canvas.style.position = "absolute";

        canvas.width = width;
        canvas.height = height;

        target = {x: width / 2, y: height / 2};

        ctx = canvas.getContext("2d");

        createMap();

    }

    // Event handling
    function addListeners() {
        if (!("ontouchstart" in window)) {
            window.addEventListener("mousemove", mouseMove);
        }
        window.addEventListener("resize", resize);
    }

    function mouseMove(e) {
        target.x = e.pageX;
        target.y = e.pageY;
    }


    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    // animation
    function initAnimation() {
        animate();
        //setInterval(heartBeat, heartBeatCD);
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < points.length; i++) {
            // detect points in range
            if (Math.abs(getDistance(target, points[i])) < 4000) {
                points[i].active = 0.3;
                points[i].circle.active = 0.6;
            } else if (Math.abs(getDistance(target, points[i])) < 20000) {
                points[i].active = 0.1;
                points[i].circle.active = 0.3;
            } else if (Math.abs(getDistance(target, points[i])) < 40000) {
                points[i].active = 0.02;
                points[i].circle.active = 0.1;
            } else {
                points[i].active = 0;
                points[i].circle.active = 0;
            }
            points[i].active = 0.6;
            points[i].circle.active = 0.6;
            drawLines(points[i]);
            points[i].circle.draw();
        }

        //for (var i = 0; i < intersections.length; i++) {
        //    var intersection = intersections[i];
        //    intersection.circle.active = 0.8;
        //    intersection.circle.draw();
        //}
        requestAnimationFrame(animate);
    }



    function heartBeat() {
        var clsP = findClosest();
        var srcCircle = new Circle(clsP, 0);
        var activeTime = heartBeatCD * 0.8;
        var _frames = activeTime * 60 / 1000;
        var step = heartBeatRange / _frames;
        var sleep = activeTime / _frames;
        var rangeArr = [[clsP]];
        for(;;) {

        }
        var f = function () {
            if(srcCircle.radius < heartBeatRange) {
                intersections.length = 0;
                for(var i = 0; i < points.length; i++) {
                    var curP = points[i];
                    for (var j = 0; j < curP.closest.length; j++) {
                        var clsP = curP.closest[j];
                        var intersection = getIntersection(curP, clsP, srcCircle);
                        if(intersection != undefined) {
                            intersection.circle = new Circle(intersection, 2);
                            intersections.push(intersection);
                        }
                    }
                }
                setTimeout(f, sleep);
                srcCircle.radius += step;
            }
        };
        f();
    }

    function findClosest() {
        var closestP = {x: -100, y: -100};
        for (var i = 0; i < points.length; i++) {
            var curP = points[i];
            closestP = getDistance(target, curP) < getDistance(target, closestP) ?
                curP : closestP;
        }
        return closestP;
    }




    function getNeighborPoint(p, type) {
        var deltaY = lineLen * Math.sin(60 * Math.PI / 180);
        var deltaX = lineLen * Math.cos(60 * Math.PI / 180);
        var res = {closest: []};

        if (type == "left" || type == "right") {
            res.x = p.x + lineLen * (type == "left" ? -1 : 1);
            res.y = p.y;
        } else if (type == "rightTop" || type == "rightBottom") {
            res.x = p.x + deltaX;
            res.y = p.y + deltaY * (type == "rightTop" ? -1 : 1)
        } else if (type == "leftTop" || type == "leftBottom") {
            res.x = p.x - deltaX;
            res.y = p.y + deltaY * (type == "leftTop" ? -1 : 1)
        }
        res.type = type;
        p.closest.push(res);
        res.closest.push(p);
        return res;
    }



    // equation
    function getIntersection(p1, p2, circle) {
        var d1 = getDistance(p1, circle.pos);
        var d2 = getDistance(p2, circle.pos);
        var maxDis = Math.max(d1, d2);
        var minDis = Math.min(d1, d2);
        if(minDis < circle.radius && maxDis > circle.radius) {
            var k = (p1.y - p2.y) / (p1.x - p2.x);
            var arg1 = circle.pos.x;
            var arg2 = circle.pos.y;
            var arg3 = p1.y - k * p1.x;

            var a = Math.pow(k, 2) + 1;
            var b = 2 * (arg3 - arg2) * k - 2 * arg1;
            var c = Math.pow(arg1, 2) + Math.pow(arg3 - arg2, 2) - Math.pow(circle.radius, 2);

            var delta = Math.sqrt(Math.pow(b, 2) - 4 * a * c);
            var candidateX1 = (-b + delta) / (2 * a);
            var candidateX2 = (b + delta) / (2 * a);

            var candidateX = (candidateX1 > Math.max(p1.x, p2.x) || candidateX1 < Math.min(p1.x, p2.x))
                ? candidateX2 : candidateX1;
            var candidateY = k * candidateX + arg3;
            return {x: candidateX, y: candidateY};
        }
        return undefined;
    }

    function Circle(pos, rad) {

        this.pos = pos || null;
        this.radius = rad || null;

        this.draw = function () {
            if (!this.active) return;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgba(" + rgb + "," + this.active + ")";
            ctx.fill();
        };

    }

    // Canvas manipulation
    function drawLines(p) {
        if (!p.active) return;
        for (var i = 0; i < p.closest.length; i++) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.closest[i].x, p.closest[i].y);
            ctx.strokeStyle = "rgba(" + rgb + "," + p.active + ")";
            ctx.stroke();
        }
    }

    // Util
    function getDistance(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }

    function createMap() {

        var source = {x: width / 2, y: height / 2, closest: []};
        var pointsQueue = [
            getNeighborPoint(source, "left"),
            getNeighborPoint(source, "rightTop"),
            getNeighborPoint(source, "rightBottom")
        ];

        // create points
        points = [source];

        for (; pointsQueue.length > 0;) {

            var p = pointsQueue.pop();
            if (0 < p.x && p.x < width && 0 < p.y && p.y < height) {
                var same = false;
                for (var i = 0; i < points.length; i++) {
                    var savedP = points[i];
                    var distance = getDistance(p, savedP);

                    if (distance < Math.pow(lineLen, 2)) {
                        same = true;
                        break;
                    }
                }
                if (!same) {
                    points.push(p);
                    var type = p.type;
                    if (type == "leftTop" || type == "leftBottom") {
                        pointsQueue.unshift(getNeighborPoint(p, "left"));
                        pointsQueue.unshift(getNeighborPoint(p, type == "leftTop" ? "rightTop" : "rightBottom"));
                    } else if (type == "rightTop" || type == "rightBottom") {
                        pointsQueue.unshift(getNeighborPoint(p, "right"));
                        pointsQueue.unshift(getNeighborPoint(p, type == "rightTop" ? "leftTop" : "leftBottom"));
                    } else if (type == "left") {
                        pointsQueue.unshift(getNeighborPoint(p, "leftBottom"));
                        pointsQueue.unshift(getNeighborPoint(p, "leftTop"));
                    } else if (type == "right") {
                        pointsQueue.unshift(getNeighborPoint(p, "rightBottom"));
                        pointsQueue.unshift(getNeighborPoint(p, "rightTop"));
                    }
                }
            }
        }

        // assign a circle to each point
        for (var i = 0; i < points.length; i++) {
            points[i].circle = new Circle(points[i], 2 + Math.random() * 2);
        }
    }

});