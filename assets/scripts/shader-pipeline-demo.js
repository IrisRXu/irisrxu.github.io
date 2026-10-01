(() => {
  const canvas = document.querySelector('#shader-canvas');
  if (!canvas) return;
  const speed = document.querySelector('#orbit-speed');
  const relief = document.querySelector('#moon-relief');
  const fallback = () => {
    const c = canvas.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, canvas.height); g.addColorStop(0, '#071226'); g.addColorStop(1, '#02050c'); c.fillStyle = g; c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#fff'; for (let i = 0; i < 90; i++) c.fillRect((i * 101) % canvas.width, (i * 43) % canvas.height, 1, 1);
    const earth = c.createRadialGradient(290, 215, 30, 270, 230, 190); earth.addColorStop(0, '#3c9b8b'); earth.addColorStop(.62, '#14527a'); earth.addColorStop(1, '#071c40'); c.fillStyle = earth; c.beginPath(); c.arc(270, 230, 185, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#aeb1bc'; c.beginPath(); c.arc(620, 140, 70, 0, Math.PI * 2); c.fill();
  };
  const gl = canvas.getContext('webgl');
  if (!gl) { fallback(); return; }
  const vertex = `attribute vec2 position;
    varying vec2 vUv;
    void main() { vUv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }`;
  const fragment = `precision mediump float;
    varying vec2 vUv;
    uniform float time;
    uniform float orbitSpeed;
    uniform float moonRelief;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p) { vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
    void main() {
      vec2 p = vUv * 2. - 1.; p.x *= 1.65;
      vec3 color = vec3(.005, .01, .03);
      float star = step(.997, hash(floor(p * 120.))); color += vec3(star);
      vec2 earthCenter = vec2(-.28, .02); vec2 earthQ = (p-earthCenter)/.58; float earthD=dot(earthQ,earthQ);
      if (earthD < 1.) {
        float z=sqrt(1.-earthD); vec3 normal=normalize(vec3(earthQ,z));
        float light=max(.08, dot(normal, normalize(vec3(-.55,.7,.9))));
        float longitude=atan(normal.x,normal.z)+time*orbitSpeed*.18; float latitude=asin(normal.y);
        float land=smoothstep(.47,.62,noise(vec2(longitude*2.5,latitude*4.)));
        vec3 surface=mix(vec3(.015,.12,.30),vec3(.05,.36,.18),land);
        surface += .035*sin(longitude*8.+latitude*6.);
        color=surface*light;
      }
      vec2 moonCenter=vec2(.54,.31); vec2 moonQ=(p-moonCenter)/.22; float moonD=dot(moonQ,moonQ);
      if (moonD < 1.) { float z=sqrt(1.-moonD); vec3 normal=normalize(vec3(moonQ,z)); float light=max(.12,dot(normal,normalize(vec3(-.55,.7,.9)))); float craters=noise(moonQ*(10.+moonRelief*12.)); color=(vec3(.35)+craters*moonRelief*.27)*light; }
      gl_FragColor=vec4(pow(color,vec3(.82)),1.);
    }`;
  function makeShader(type, source) { const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s); if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  try {
    const program=gl.createProgram(); gl.attachShader(program,makeShader(gl.VERTEX_SHADER,vertex)); gl.attachShader(program,makeShader(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program); if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)); gl.useProgram(program);
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const timeLoc=gl.getUniformLocation(program,'time'), speedLoc=gl.getUniformLocation(program,'orbitSpeed'), reliefLoc=gl.getUniformLocation(program,'moonRelief');
    function draw(ms) { gl.viewport(0,0,canvas.width,canvas.height); gl.uniform1f(timeLoc,ms*.001); gl.uniform1f(speedLoc,Number(speed.value)); gl.uniform1f(reliefLoc,Number(relief.value)); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); requestAnimationFrame(draw); }
    requestAnimationFrame(draw);
  } catch (error) { console.error('Shader pipeline error:', error); fallback(); }
})();
