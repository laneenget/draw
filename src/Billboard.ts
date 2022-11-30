/* Assignment 6: A World Made of Drawings 
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'

export class Billboard extends gfx.Transform3
{
    // 2D path drawn on screen in normalized device coordinates
    public screenPath: gfx.Vector2[];

    // Start point of the billboard origin in 3D world space
    public startPoint: gfx.Vector3;

    // Child mesh object to hold the billboard vertices
    public mesh: gfx.Mesh;

    // Parameter that determines width of the stroke
    public strokeWidth: number;

    // Data structures to hold the vertices and indices while the path is being drawn
    private vertices: gfx.Vector3[];
    private indices: number[];
    
    constructor(deviceCoords = new gfx.Vector2(), startPoint = new gfx.Vector3(), color = new gfx.Color(), strokeWidth = 0.02)
    {
        super();

        this.strokeWidth = strokeWidth;
        this.startPoint = new gfx.Vector3(startPoint.x, startPoint.y, startPoint.z);

        this.screenPath = [];
        this.screenPath.push(new gfx.Vector2(deviceCoords.x, deviceCoords.y));
        
        this.vertices = [];
        this.vertices.push(new gfx.Vector3(deviceCoords.x, deviceCoords.y, -1));
        this.vertices.push(new gfx.Vector3(deviceCoords.x, deviceCoords.y, -1));

        this.indices = [];

        this.mesh = new gfx.Mesh();
        this.mesh.material = new gfx.UnlitMaterial();
        this.mesh.material.side = gfx.Side.DOUBLE;
        this.mesh.material.setColor(color);
        this.mesh.autoUpdateMatrix = false;
        this.add(this.mesh);

        this.mesh.setVertices(this.vertices);
        this.mesh.setIndices(this.indices);
        this.mesh.createDefaultVertexColors();
    }

    // This method is called to add new points to the stroke when the user moves
    // the mouse while drawing on the screen.
    addNewPoint(deviceCoords: gfx.Vector2): void
    {
        const newPoint = new gfx.Vector2(deviceCoords.x, deviceCoords.y);
        const endPoint = this.screenPath[this.screenPath.length-1];

        if(newPoint.distanceTo(endPoint) > this.strokeWidth / 2)
        {
            const strokeVector = gfx.Vector2.subtract(newPoint, endPoint);
            strokeVector.normalize();
            strokeVector.rotate(Math.PI / 2);
            strokeVector.multiplyScalar(this.strokeWidth/2);

            const vertex1 = gfx.Vector2.subtract(newPoint, strokeVector);
            const vertex2 = gfx.Vector2.add(newPoint, strokeVector);
            
            const nextIndex = this.vertices.length;
            this.vertices.push(new gfx.Vector3(vertex1.x, vertex1.y, -1));
            this.vertices.push(new gfx.Vector3(vertex2.x, vertex2.y, -1));

            this.indices.push(nextIndex, nextIndex + 1, nextIndex - 2);
            this.indices.push(nextIndex - 1, nextIndex - 2, nextIndex + 1);

            this.screenPath.push(newPoint);

            this.mesh.setVertices(this.vertices);
            this.mesh.setIndices(this.indices);
            this.mesh.createDefaultVertexColors();
        }
    }

    // This method moves the billboard to current position and rotation of the camera.
    // We then manually set the matrix of the child  mesh to be the inverse of the
    // camera's projection matrix.  This "cancels out" the camera projection that will 
    // be performed later by the vertex shader.  This means that we can now define the 
    // mesh vertices directly in 2D screen coordinates while the path is being drawn. 
    projectToNearPlane(camera: gfx.Camera): void
    {
        this.position.copy(camera.position);
        this.rotation.copy(camera.rotation);
        this.mesh.matrix.copy(camera.projectionMatrix.inverse());
    }

    // This method projects the billboard out into the world.  We use this to create a
    // billboard in 3D space when the user starts drawing on the ground and ends in the sky.
    projectToWorld(camera: gfx.Camera): void
    {
        // Reset the transforms for the billboard and child mesh.
        this.resetBillboard();

        // Set the position (local origin) of the billboard to the world space position
        // that the user was clicking on when starting the drawing.
        this.position.copy(this.startPoint);

        // Create a projection plane that intersects the first vertex and is oriented
        // towards the camera (orthogonal to the camera's forward vector).
        const projectionPlaneNormal = new gfx.Vector3(0, 0, -1);
        projectionPlaneNormal.rotate(camera.rotation);
        const projectionPlane = new gfx.Plane(this.startPoint, projectionPlaneNormal);

        // We compute the rotation that will point the billboard vertices towards the camera,
        // ignoring its height because we want the billboard to always be vertical.
        const cameraOnGround = new gfx.Vector3(camera.position.x, 0, camera.position.z);
        this.lookAt(cameraOnGround);
        const rotationInverse = this.rotation.inverse();
        
        // Loop through all the vertices in the billboard mesh and project them out
        // into the world.  To accomplish this, we use a pick ray to perform an 
        // intersection test with the projection plane.
        const point = new gfx.Vector2(this.vertices[0].x, this.vertices[0].y);
        const ray = new gfx.Ray();
        for(let i=0; i < this.vertices.length; i++)
        {
            point.set(this.vertices[i].x, this.vertices[i].y);
            ray.setPickRay(point, camera);

            const intersection = ray.intersectsPlane(projectionPlane);
            if(intersection)
            {
                this.vertices[i].copy(intersection);
                this.vertices[i].subtract(this.position);
                this.vertices[i].rotate(rotationInverse);
            }
        }

        // Assign the new mesh vertices
        this.mesh.setVertices(this.vertices);
    }

    // This method projects the billboard out into the world when the user starts drawing
    // on a billboard that was previously created.
    projectToBillboard(camera: gfx.Camera, parent: Billboard): void
    {
        // Reset the transforms for the billboard and child mesh.
        this.resetBillboard();

        // Set the position (local origin) of the billboard to the world space position
        // of the parent billboard.
        this.position.copy(parent.position);

        // Create a projection plane that intersects the first vertex and is oriented
        // towards the camera (orthogonal to the camera's forward vector).
        const projectionPlaneNormal = new gfx.Vector3(0, 0, -1);
        projectionPlaneNormal.rotate(camera.rotation);
        const projectionPlane = new gfx.Plane(this.startPoint, projectionPlaneNormal);

        // We compute the rotation that will point the billboard vertices towards the camera,
        // ignoring its height because we want the billboard to always be vertical.
        const cameraOnGround = new gfx.Vector3(camera.position.x, 0, camera.position.z);
        this.lookAt(cameraOnGround);
        const rotationInverse = this.rotation.inverse();
        
        // Loop through all the vertices in the billboard mesh and project them out
        // into the world.  To accomplish this, we use a pick ray to perform an 
        // intersection test with the projection plane.
        const point = new gfx.Vector2(this.vertices[0].x, this.vertices[0].y);
        const ray = new gfx.Ray();
        for(let i=0; i < this.vertices.length; i++)
        {
            point.set(this.vertices[i].x, this.vertices[i].y);
            ray.setPickRay(point, camera);

            const intersection = ray.intersectsPlane(projectionPlane);
            if(intersection)
            {
                this.vertices[i].copy(intersection);
                this.vertices[i].subtract(this.position);
                this.vertices[i].rotate(rotationInverse);
            }
        }

        // Assign the new mesh vertices
        this.mesh.setVertices(this.vertices);
    }


    // Part 2: Drawing in the Sky
    // First, you should take a look at the projectToNearPlane(), projectToWorld(), 
    // and projectToBillboard()` methods implemented above.  The structure for this
    // method will be similar, except you will be ray casting to the sky mesh.
    projectToSky(camera: gfx.Camera, sky: gfx.Mesh): void
    {
        // Reset the transform for the billboard and mesh.
        // You will not need to change these variables.
        this.resetBillboard();


        // Loop through all the vertices in the billboard mesh and then project them
        // on to the sky. To accomplish this, you should use a pick ray to perform
        // an intersection test with the sky box. Note if you simply move the vertex 
        // to the exact point of intersection, you may end up with "z-fighting" where 
        // the billboard and sky are both trying to render on top of each other. To 
        // fix this, you can move the projected vertex slightly closer to the camera
        // using the direction vector of the pick ray.
        
       

        // TO DO: ADD YOUR CODE HERE


        
    }

    private resetBillboard(): void
    {
        // Reset the position and rotation of the billboard
        this.position.set(0, 0, 0);
        this.rotation.setIdentity();

        // Reset the matrix that projects the billboard into different coordinate spaces
        this.mesh.matrix.setIdentity();
    }
}