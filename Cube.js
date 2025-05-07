class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 0.0, 0.0, 1.0]; // default red
    this.matrix = new Matrix4();
  }

  render() {
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const vertices = new Float32Array([

      // front
      0, 0, 0,   0, 0, -1,
      1, 1, 0,   0, 0, -1,
      1, 0, 0,   0, 0, -1,
      0, 0, 0,   0, 0, -1,
      0, 1, 0,   0, 0, -1,
      1, 1, 0,   0, 0, -1,

      // back
      0, 0, 1,   0, 0, 1,
      1, 0, 1,   0, 0, 1,
      1, 1, 1,   0, 0, 1,
      0, 0, 1,   0, 0, 1,
      1, 1, 1,   0, 0, 1,
      0, 1, 1,   0, 0, 1,

      // top
      0, 1, 0,   0, 1, 0,
      0, 1, 1,   0, 1, 0,
      1, 1, 1,   0, 1, 0,
      0, 1, 0,   0, 1, 0,
      1, 1, 1,   0, 1, 0,
      1, 1, 0,   0, 1, 0,

      // bottom
      0, 0, 0,   0, -1, 0,
      1, 0, 0,   0, -1, 0,
      1, 0, 1,   0, -1, 0,
      0, 0, 0,   0, -1, 0,
      1, 0, 1,   0, -1, 0,
      0, 0, 1,   0, -1, 0,

      // right
      1, 0, 0,   1, 0, 0,
      1, 1, 0,   1, 0, 0,
      1, 1, 1,   1, 0, 0,
      1, 0, 0,   1, 0, 0,
      1, 1, 1,   1, 0, 0,
      1, 0, 1,   1, 0, 0,

      // left
      0, 0, 0,   -1, 0, 0,
      0, 0, 1,   -1, 0, 0,
      0, 1, 1,   -1, 0, 0,
      0, 0, 0,   -1, 0, 0,
      0, 1, 1,   -1, 0, 0,
      0, 1, 0,   -1, 0, 0,
    ]);

    const FSIZE = vertices.BYTES_PER_ELEMENT;

    // buffer
    const buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create buffer');
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    const a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
