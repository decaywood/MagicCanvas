jQuery.magicCanvas = {
    draw: function (opt) {

        polyFill();

        var width,
            height,
            canvas,
            ctx,
            points,
            target,
            draw = true,
            intersections = [],
            $canvas = $("#reactive-bg-canvas");

        var defaults = {
            lineLen: 30,
            heartBeatCD: 3000,
            heartBeatRange: 300,
            rgb: {r: 156, g: 217, b: 249},
            type: "heart-beat",
            zIndex: -99999
        };

        var options = $.extend(defaults, opt);

        $(document).mouseenter(function () {
            draw = true;
        });

        $(document).mouseleave(function () {
            draw = false;
        });

        // Main
        initMap();
        initAnimation();
        addListeners();

        function initMap() {

            canvas = document.getElementById("reactive-bg-canvas");

            width = $(window).width();
            height = $(window).height();
            canvas.style.position = "fixed";
            canvas.style.zIndex = options.zIndex;
            canvas.style.top = '0px';
            canvas.style.left = '0px';

            canvas.width = width;
            canvas.height = height;

            target = {x: width / 2, y: height / 2, rx: width / 2, ry: height / 2};

            ctx = canvas.getContext("2d");

            createMap();

        }

        // Event handling
        function addListeners() {
            if (!("ontouchstart" in window)) {
                window.addEventListener("mousemove", mouseMove);
            }
            window.addEventListener("scroll", scroll);
            window.addEventListener("resize", resize);
        }

        function scroll() {
            target.x = target.rx + document.body.scrollLeft + document.documentElement.scrollLeft;
            target.y = target.ry + document.body.scrollTop + document.documentElement.scrollTop;
        }

        function mouseMove(e) {

            if (e.pageX || e.pageY) {
                target.x = e.pageX;
                target.y = e.pageY;
            }
            else if (e.clientX || e.clientY) {
                target.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                target.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            target.rx = e.clientX;
            target.ry = e.clientY;
        }


        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            window.cancelAnimationFrame();
            initMap();
            initAnimation();
        }

        // animation
        function initAnimation() {
            animate();
            if(options.type == "heart-beat") {
                setInterval(heartBeat, options.heartBeatCD);
            } else if (options.type == "random-move") {
                for (var i = 0; i < points.length; i++) {
                    shiftPoint(points[i]);
                }
            }
        }

        function animate() {

            ctx.clearRect(0, 0, width, height);

            if(options.type == "heart-beat") {
                for (var i = 0; i < intersections.length; i++) {
                    var intersection = intersections[i];
                    if (intersection.circle.active > 0) {
                        intersection.circle.active -= 0.012;
                        intersection.circle.draw();
                    }
                }
            } else if (options.type == "random-move") {

                var rp = getRelativeP();

                for (var i = 0; i < points.length; i++) {
                    // detect points in range
                    if (Math.abs(getDistance(rp, points[i])) < 4000) {
                        points[i].active = 0.3;
                        points[i].circle.active = 0.6;
                    } else if (Math.abs(getDistance(rp, points[i])) < 20000) {
                        points[i].active = 0.1;
                        points[i].circle.active = 0.3;
                    } else if (Math.abs(getDistance(rp, points[i])) < 40000) {
                        points[i].active = 0.02;
                        points[i].circle.active = 0.1;
                    } else {
                        points[i].active = 0;
                        points[i].circle.active = 0;
                    }
                    drawLines(points[i]);
                    points[i].circle.draw();
                }
            }
            requestAnimationFrame(animate);
        }


        function heartBeat() {
            var clsP = findClosest();
            var srcCircle = new Circle(clsP, 0);
            var activeTime = options.heartBeatCD * 0.8;
            var _frames = activeTime * 60 / 1000;
            var step = options.heartBeatRange / _frames;
            var sleep = activeTime / _frames;
            var originOpacity = 0.8;
            var centerP = getRelativeP();
            intersections = [];

            var f = function () {
                if (srcCircle.radius < options.heartBeatRange) {
                    for (var i = 0; i < points.length; i++) {
                        var curP = points[i];
                        if (getDistance(curP, srcCircle.pos) < Math.pow(srcCircle.radius, 2)) {
                            for (var j = 0; j < curP.closest.length; j++) {
                                var clsP = curP.closest[j];
                                var intersection = getIntersection(curP, clsP, srcCircle);
                                if (intersection != undefined) {
                                    intersection.circle = new Circle(intersection, 1.2, centerP);
                                    intersection.circle.active = originOpacity;
                                    originOpacity *= 0.999;
                                    intersections.push(intersection);
                                }
                            }
                        }
                    }
                    setTimeout(f, sleep);
                    srcCircle.radius += step;
                }
            };
            if (draw) f();
        }

        function shiftPoint(p) {
            TweenLite.to(p, 1 + Math.random(), {
                x: p.originX - 50 + Math.random() * 100,
                y: p.originY - 50 + Math.random() * 100,
                onComplete: function () {
                    shiftPoint(p);
                }
            });
        }

        function findClosest() {
            var closestP = {x: -100, y: -100};
            var rp = getRelativeP();
            for (var i = 0; i < points.length; i++) {
                var curP = points[i];
                closestP = getDistance(rp, curP) < getDistance(rp, closestP) ?
                    curP : closestP;
            }
            return closestP;
        }


        function getNeighborPoint(p, type) {
            var deltaY = options.lineLen * Math.sin(60 * Math.PI / 180);
            var deltaX = options.lineLen * Math.cos(60 * Math.PI / 180);
            var res = {closest: []};

            if (type == "left" || type == "right") {
                res.x = p.x + options.lineLen * (type == "left" ? -1 : 1);
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
            var maxDis = Math.sqrt(Math.max(d1, d2));
            var minDis = Math.sqrt(Math.min(d1, d2));
            if (minDis < circle.radius && maxDis > circle.radius) {
                var k = (p1.y - p2.y) / (p1.x - p2.x);
                var b = p1.y - k * p1.x;
                var c = -circle.pos.x;
                var d = -circle.pos.y;
                var r = circle.radius;

                var delta = (Math.pow(k, 2) + 1) * Math.pow(r, 2) - Math.pow(c * k, 2) + 2 * (c * d + b * c) * k - Math.pow(d + b, 2);
                var candidateX1 = (-1 * Math.sqrt(delta) - k * (d + b) - c) / (Math.pow(k, 2) + 1);
                var candidateX2 = (Math.sqrt(delta) - k * (d + b) - c) / (Math.pow(k, 2) + 1);

                var candidateX = (candidateX1 < Math.max(p1.x, p2.x) && candidateX1 > Math.min(p1.x, p2.x))
                    ? candidateX1 : candidateX2;
                var candidateY = k * candidateX + b;
                return {x: candidateX, y: candidateY};
            }

            return undefined;
        }

        function Circle(pos, rad, centerP) {

            this.pos = pos || null;
            this.radius = rad || null;
            this.centerP = centerP;

            this.draw = function () {
                if (!this.active) return;
                ctx.beginPath();
                ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
                var rgbRes = typeof options.rgb == "function" ? options.rgb(this.pos, this.centerP || this.pos) : options.rgb;
                rgbRes = "".concat(rgbRes.r).concat(",").concat(rgbRes.g).concat(",").concat(rgbRes.b);
                ctx.fillStyle = "rgba(" + rgbRes + "," + this.active + ")";
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
                var rgbRes = typeof options.rgb == "function" ? options.rgb(target) : options.rgb;
                rgbRes = "".concat(rgbRes.r).concat(",").concat(rgbRes.g).concat(",").concat(rgbRes.b);
                ctx.strokeStyle = "rgba(" + rgbRes + "," + p.active + ")";
                ctx.stroke();
            }
        }

        // Util
        function getDistance(p1, p2) {
            return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        }

        function createMap() {

            if(options.type == "random-move") {

                points = [];

                for (var x = 0; x < width; x = x + width / 20) {
                    for (var y = 0; y < height; y = y + height / 20) {
                        var px = x + Math.random() * width / 20;
                        var py = y + Math.random() * height / 20;
                        var p = {x: px, originX: px, y: py, originY: py};
                        points.push(p);
                    }
                }

                // for each point find the 5 closest points
                for (var i = 0; i < points.length; i++) {
                    var closest = [];
                    var p1 = points[i];
                    for (var j = 0; j < points.length; j++) {
                        var p2 = points[j];
                        if (!(p1 == p2)) {
                            var placed = false;
                            for (var k = 0; k < 5; k++) {
                                if (!placed) {
                                    if (closest[k] == undefined) {
                                        closest[k] = p2;
                                        placed = true;
                                    }
                                }
                            }

                            for (var k = 0; k < 5; k++) {
                                if (!placed) {
                                    if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                                        closest[k] = p2;
                                        placed = true;
                                    }
                                }
                            }
                        }
                    }
                    p1.closest = closest;
                }

                // assign a circle to each point
                for (var i = 0; i < points.length; i++) {
                    points[i].circle = new Circle(points[i], 2 + Math.random() * 2, undefined);
                }

            } else if (options.type == "heart-beat") {

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

                            if (distance < Math.pow(options.lineLen, 2) * 0.1) {
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
                    points[i].circle = new Circle(points[i], 2);
                }
            }

        }

        function getRelativeP() {
            var x = target.x - $canvas.offset().left;
            var y = target.y - $canvas.offset().top;
            return {x: x, y: y}
        }

        function polyFill() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
                window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
            }
            if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
            if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    }


};
