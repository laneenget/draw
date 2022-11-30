/* Assignment 6: A World Made of Drawings 
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { GUI } from 'dat.gui'
import { Billboard } from './Billboard';
import { Ground } from './Ground';
import { ToonMaterial } from './materials/ToonMaterial'
import { OutlineMaterial } from './materials/OutlineMaterial'

// This enumerator is used to keep track of the current drawing state
enum DrawState
{
    NO_DRAWING,
    DRAWING_GROUND,
    DRAWING_SKY,
    DRAWING_BILLBOARD
}

export class DrawingApp extends gfx.GfxApp
{
    // Mesh objects in the scene
    private ground: Ground;
    private skyBox: gfx.BoxMesh;

    // Array to hold all the billboards that have been added to the scene
    private billboards: Billboard[];

    // The current billboard that is being drawn
    private currentBillboard: Billboard | null;

    // This is used if the user draws on an existing billboard
    private targetBillboard: Billboard | null;

    // Camera controller with for keyboard/mouse input
    private cameraControls: gfx.FirstPersonControls;

    // Parameter to determine the camera's height above the ground
    private cameraHeight: number;

    // State variable used to remember the current draw mode
    private drawState: DrawState;

    // GUI paremeters
    private groundColor: string;
    private skyColor: string;
    private crayonColor: string;
    private strokeWidth: number;

    constructor()
    {
        super();

        this.cameraControls = new gfx.FirstPersonControls(this.camera);
        this.cameraControls.mouseButton = 2;
        this.cameraControls.flyMode = false;
        this.cameraControls.translationSpeed = 5;
        this.cameraHeight = 2.0;

        this.drawState = DrawState.NO_DRAWING;

        this.ground = new Ground(100, 100);
        this.skyBox = new gfx.BoxMesh(500, 500, 500);

        this.skyColor = '#bfeafc';
        this.groundColor = '#400040';
        this.crayonColor = '#219d20';
        this.strokeWidth = 0.02;

        this.billboards = [];
        this.currentBillboard = null;
        this.targetBillboard = null;
    }

    createScene(): void 
    {
        // Setup camera
        this.camera.setPerspectiveCamera(60, 1920/1080, .1, 750)
        this.camera.position.set(0, this.cameraHeight, 3.5);
        this.camera.lookAt(new gfx.Vector3(0, this.cameraHeight, 0));

        // Create the scene lighting
        const sceneLight = new gfx.PointLight();
        sceneLight.ambientIntensity.set(0.75, 0.75, 0.75);
        sceneLight.diffuseIntensity.set(1, 1, 1);
        sceneLight.specularIntensity.set(1, 1, 1);
        sceneLight.position.set(10, 10, 10);
        this.scene.add(sceneLight);
 
        // Create the sky box
        this.skyBox.material = new gfx.UnlitMaterial();
        this.skyBox.material.setColor(gfx.Color.createFromString(this.skyColor));
        this.skyBox.material.side = gfx.Side.BACK;
        this.scene.add(this.skyBox);

        // Create a toon material for rendering the ground
        const toonMaterial = new ToonMaterial(
            new gfx.Texture('./assets/toonDiffuse.png'),
            new gfx.Texture('./assets/toonSpecular.png'),
        );
        toonMaterial.ambientColor.setFromString(this.groundColor);
        toonMaterial.diffuseColor.set(0.4, 0.4, 0.4);
        toonMaterial.specularColor.set(1, 1, 1);
        toonMaterial.shininess = 50;

        // Create an outline material that wraps the toon material
        // and then assign it to the ground mesh
        const outlineMaterial = new OutlineMaterial(toonMaterial);
        outlineMaterial.thickness = 0.2;
        this.ground.material = outlineMaterial;
       
        // Add the ground mesh to the scene
        this.scene.add(this.ground);
 
         // Create the GUI
         const gui = new GUI();
         gui.width = 250;
 
         // Setup the GUI controls
         const controls = gui.addFolder("Harold's Crayons");
         controls.open();
 
         const crayonColorController = controls.addColor(this, 'crayonColor');
         crayonColorController.name('Crayon Color');
 
         const skyColorController = controls.addColor(this, 'skyColor');
         skyColorController.name('Sky Color');
         skyColorController.onChange(() => { 
            this.skyBox.material.setColor(gfx.Color.createFromString(this.skyColor));
          });
 
         const groundColorController = controls.addColor(this, 'groundColor');
         groundColorController.name('Ground Color');   
         groundColorController.onChange(() => { 
            toonMaterial.ambientColor.setFromString(this.groundColor);
         }); 
         
         const strokeWidthController = controls.add(this, 'strokeWidth', 0.01, 0.05);
         strokeWidthController.name('Stroke Width');   
    }

    update(deltaTime: number): void
    {
        // We only want to move the camera if we are not currently drawing on screen
        if(this.drawState == DrawState.NO_DRAWING)
        {
            // Update the camera position and rotation based on user input
            this.cameraControls.update(deltaTime);

            
            // Part 4: Walking on the Ground
            // If the camera has moved this frame, then we want to cast a ray downwards
            // from the current camera position to determine the distance to the ground.
            // Note that this is not a mouse pick ray that depends on the camera, so you
            // will want to use the set() method of the gfx.Ray class, not the setPickRay()
            // method that was used in other parts of this program.
            if(this.cameraControls.hasMoved)
            {


                // TO DO: ADD YOUR CODE HERE



                // We also need to adjust the billboards to point towards the camera
                const cameraOnGround = new gfx.Vector3(this.camera.position.x, 0, this.camera.position.z);
                this.billboards.forEach((billboard: Billboard) => {
                    billboard.lookAt(cameraOnGround);
                });
            }
        }
    }

    onMouseDown(event: MouseEvent): void 
    {
        // Left mouse button is pressed
        if(event.button == 0)
        {
            // Get the mouse position in normalized device coordinates
            const deviceCoords = this.getNormalizedDeviceCoordinates(event.x, event.y);

            // Create new pick ray
            const ray = new gfx.Ray();
            ray.setPickRay(deviceCoords, this.camera);

            // Mouse-billboard interactions
            // Loop through all the billboards in the scene and perform an intersection
            // test with each one to see if we are drawing on an existing billboard.
            for(let i=0; i < this.billboards.length; i++)
            {
                // Mouse-billboard intersection test
                const billboardIntersection = ray.intersectsMesh(this.billboards[i].mesh);

                // If we found an intersection
                if(billboardIntersection)
                {
                    // Set the current draw state
                    this.drawState = DrawState.DRAWING_BILLBOARD;

                    // Set the target (parent) billboard that we will project to later
                    this.targetBillboard = this.billboards[i];
                    
                    // Create a new billboard and add it to the scene
                    this.currentBillboard = new Billboard(
                        deviceCoords, 
                        billboardIntersection, 
                        gfx.Color.createFromString(this.crayonColor), 
                        this.strokeWidth
                    );
                    this.scene.add(this.currentBillboard);   

                    // We found an intersection, so we can just return from the update method
                    // here and avoid wasting computation on more intersection tests.
                    return;
                }
            }

            // Mouse-ground Intersections
            // Because we have stored the vertices and indices of the ground object in CPU memory, we can
            // call the ray.intersectsTriangles() method directly instead of the intersectsMesh() method.
            // Both methods will accomplish the same result, but this is more computationally efficient
            // because it doesn't require copying data from the buffers in GPU memory.
            const groundIntersection = ray.intersectsTriangles(this.ground.vertices, this.ground.indices);

            // If we found an intersection
            if(groundIntersection)
            { 
                // Set the current draw state
                this.drawState = DrawState.DRAWING_GROUND;

                // Create a new billboard and add it to the scene
                this.currentBillboard = new Billboard(
                    deviceCoords, 
                    groundIntersection, 
                    gfx.Color.createFromString(this.crayonColor), 
                    this.strokeWidth
                );
                this.scene.add(this.currentBillboard);

                // We found an intersection, so we can just return from the update method
                // here and avoid wasting computation on more intersection tests.
                return;
            }


            // Part 1: Mouse-Sky Interactions
            // This should project a 2D normalized screen point (e.g., the mouse position in normalized
            // device coordinates) to a 3D point on the "sky," which is really a huge box that the viewer
            // is inside.  This ray cast should always return a result because any screen point can 
            // successfully be projected onto the box.  You can use the ray.intersectsMesh() method to
            // perform the intersection test.

            // Note that ray casts will only test if the ray passing through the screen point intersects the 
            // specific geometry we are testing against.  It does not check to see if the ray hits the ground
            // or anything else first.  
            
            // Then, you should create a new billboard at the sky intersection point.  You should also set the
            // draw state to correct mode, similar to the code blocks above for the ground and billboard.


            // TO DO: ADD YOUR CODE HERE

            
        }
    }

    onMouseMove(event: MouseEvent): void 
    {
        // If the mouse moves while we are currently drawing a billboard, then we add
        // a new point to the billboard that is currently being drawn.  Then, we project
        // the billboard onto the camera's near plane so that it will seem like we are
        // drawing directly on the surface of the screen.
        if(this.currentBillboard && this.drawState != DrawState.NO_DRAWING)
        {     
            const deviceCoords = this.getNormalizedDeviceCoordinates(event.x, event.y);
            this.currentBillboard.addNewPoint(deviceCoords);
            this.currentBillboard.projectToNearPlane(this.camera);
        }
    }

    onMouseUp(event: MouseEvent): void 
    {
        // Left mouse button is released and we are currently drawing a billboard
        if(event.button == 0 && this.currentBillboard)
        {
            // If we were adding to an existing billboard
            if(this.drawState == DrawState.DRAWING_BILLBOARD)
            { 
                if(this.targetBillboard)
                {
                    // Project the new billboard into the world using the same origin as its parent.
                    this.currentBillboard.projectToBillboard(this.camera, this.targetBillboard);

                    // Add the billboard to the array. Any billboards in this array will be pointed
                    // towards the camera during the update() method as the user moves around.
                    this.billboards.push(this.currentBillboard);
                }
            }

            // If we are drawing on the sky
            else if(this.drawState == DrawState.DRAWING_SKY)
            {
                // Project the billboard on to the sky box. 
                this.currentBillboard.projectToSky(this.camera, this.skyBox);

                // Note that we should not the billboard to the array as was done above, because  billboards
                // that are drawn on the sky should appear fixed and are not pointed towards the camera.
            }

            // If we are currently drawing on the ground
            else if(this.drawState == DrawState.DRAWING_GROUND)
            {
                // Get the mouse position in normalized device coordinates
                const deviceCoords = this.getNormalizedDeviceCoordinates(event.x, event.y);

                // Create a new pick ray
                const ray = new gfx.Ray();
                ray.setPickRay(deviceCoords, this.camera);

                // Because we have stored the vertices and indices of the ground object in CPU memory, we can
                // call the ray.intersectsTriangles() method directly instead of the intersectsMesh() method.
                // Both methods will accomplish the same result, but this is more computationally efficient
                // because it doesn't require copying data from the buffers in GPU memory.
                const groundIntersection = ray.intersectsTriangles(this.ground.vertices, this.ground.indices);

                // Starts on the ground and ends on the ground
                if(groundIntersection)
                { 
                    // If the path is long enough, then we call the reshapeGround() method to edit the mesh
                    if(this.currentBillboard.screenPath.length >= 6)
                    {
                        this.ground.reshapeGround(
                            this.currentBillboard.screenPath, 
                            this.currentBillboard.startPoint,
                            groundIntersection,
                            this.camera
                        );
                    }
                    else
                    {
                        console.log("Path is too short to reshape ground.");
                    }

                    // The billboard should then be removed from the scene because we are only editing the ground
                    this.currentBillboard.remove();
                }

                // Starts on the ground and ends in the sky
                else
                {
                    // Project the billboard out into the 3D scene
                    this.currentBillboard.projectToWorld(this.camera);

                    // Add the billboard to the array. Any billboards in this array will be pointed
                    // towards the camera during the update() method as the user moves around.
                    this.billboards.push(this.currentBillboard);
                }
            }
         
            // The mouse button has been released, so we should reset the draw state and current billboard
            this.drawState = DrawState.NO_DRAWING;
            this.currentBillboard = null;
        }
    }
}