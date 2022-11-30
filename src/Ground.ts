/* Assignment 6: A World Made of Drawings 
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'

export class Ground extends gfx.Mesh
{
    public vertices: gfx.Vector3[];
    public normals: gfx.Vector3[];
    public indices: number[];

    constructor(size: number, segments: number)
    {
        super();

        // A simple grid is used to initialize ground geometry.  If it is running too slow,
        // you can turn down the resolution by decreasing the number of segments, but this 
        // will make the hills look more jaggy.
        this.vertices = [];
        this.normals = [];
        this.indices = [];

        // Compute the grid vertices and normals
        const increment = size / segments;
        for(let i = -size/2; i <= size/2; i += increment)
        {
            for(let j= -size/2; j <= size/2; j += increment)
            {
                this.vertices.push(new gfx.Vector3(i, 0, j));
                this.normals.push(new gfx.Vector3(0, 1, 0));
            }
        }

        // Compute the indices for all the grid triangles
        for(let i = 0; i < segments; i++)
        {
            for(let j = 0; j < segments; j++)
            {
                // First triangle
                this.indices.push( i * (segments+1) + j);
                this.indices.push( i * (segments+1) + (j+1));
                this.indices.push( (i+1) * (segments+1) + j);

                // Second triangle
                this.indices.push( (i+1) * (segments+1) + j);
                this.indices.push( i * (segments+1) + (j+1));
                this.indices.push( (i+1) * (segments+1) + (j+1));
            }
        }

        // Assign the data to the mesh
        this.setVertices(this.vertices);
        this.setNormals(this.normals);
        this.setIndices(this.indices);
        this.createDefaultVertexColors();
    }


    // Part 3: Editing the Ground
    // This function modifies the vertices of the ground mesh to create a hill or valley 
    // based on the input stroke.  The 2D path of the stroke on the screen is passed in. 
    // This is the centerline of the stroke that is actually drawn on the screen.
    public reshapeGround(screenPath: gfx.Vector2[], groundStartPoint: gfx.Vector3,  groundEndPoint: gfx.Vector3, camera: gfx.Camera): void
    {
        // Deform the 3D ground mesh according to the algorithm described in the
        // Harold paper by Cohen et al.

        // There are 3 major steps to the algorithm, outlined here:

        // 1. Define a plane to project the stroke onto.  The gfx.Plane class defines 
        // a plane using two parameters: a point on the plane and the plane normal.

        // The first and last points of the stroke projected onto the ground plane are
        // provided as groundStartPoint and groundEndPoint.  The plane should pass 
        // through these two points on the ground.  The plane should also have a normal 
        // vector that is parallel to the ground plane.



        // TO DO: ADD YOUR CODE HERE



        // 2. Loop through the screenPath vertices to project the 2D stroke into 3D so
        // that it lies on the "projection plane" defined in step 1.

        // You will need to create a gfx.Ray as discussed in class.  Youu can use the
        // ray.intersectPlane() method to check for an intersection with a gfx.Plane.



        // TO DO: ADD YOUR CODE HERE



        // 3. Loop through all of the vertices of the ground mesh, and adjust the
        // height of each based on the equations in section 4.5 of the paper, also
        // repeated in the assignment readme.  The equations rely upon a function
        // h(), and we have implemented that for you as computeH() defined below.
        


        // TO DO: ADD YOUR CODE HERE



        // Finally, the new vertex positions have been computed, we need to assign
        // them to the mesh and recompute new vertex normals.
        this.setVertices(this.vertices);
        this.recomputeNormals();
    }


    // This implements the "h" term used in the equations described in section 4.5 of the paper. 
    // Three arguments are needed:
    //
    // 1. closestPoint: As described in the paper, this is the closest point within
    // the projection plane to the vertex of the mesh that we want to modify.  In other
    // words, it is the perpendicular projection of the vertex we want to modify onto
    // the projection plane.
    //
    // 2. silhouetteCurve: As described in the paper, the silhouette curve is a 3D version
    // of the curve the user draws with the mouse.  It is formed by projecting the
    // original 2D screen-space curve onto the 3D projection plane. 
    //
    // 3. projectionPlane: We need to know where the projection plane is in 3D space.
    private computeH(closestPoint: gfx.Vector3, silhouetteCurve: gfx.Vector3[], projectionPlane: gfx.Plane): number
    {
        // Define the y axis for a "plane space" coordinate system as a world space vector
        const planeY = new gfx.Vector3(0, 1, 0);

         // Define the x axis for a "plane space" coordinate system as a world space vector
        const planeX = gfx.Vector3.cross(planeY, projectionPlane.normal);
        planeX.normalize();

        // Define the origin for a "plane space" coordinate system as the first point in the curve
        const origin = silhouetteCurve[0];

        // Loop over line segments in the curve. We need to find the one that lies over the point
        // by comparing the "plane space" x value for the start and end of the line segment to the
        // "plane space" x value for the closest point that lies in the projection plane.
        const xTarget = gfx.Vector3.subtract(closestPoint, origin).dot(planeX);
        for(let i=1; i < silhouetteCurve.length; i++)
        {
            const xStart = gfx.Vector3.subtract(silhouetteCurve[i-1], origin).dot(planeX);
            const xEnd = gfx.Vector3.subtract(silhouetteCurve[i], origin).dot(planeX);

            if((xStart <= xTarget) && (xTarget <= xEnd))
            {
                const alpha = (xTarget - xStart) / (xEnd - xStart);
                const yCurve = silhouetteCurve[i-1].y + alpha * (silhouetteCurve[i].y - silhouetteCurve[i-1].y);
                return yCurve - closestPoint.y;
            }
            else if((xEnd <= xTarget) && (xTarget <= xStart))
            {
                const alpha = (xTarget - xEnd) / (xStart - xEnd);
                const yCurve = silhouetteCurve[i].y + alpha * (silhouetteCurve[i-1].y - silhouetteCurve[i].y); 
                return yCurve - closestPoint.y;
            }
        }

        // Return 0 because the point does not lie under the curve
        return 0;
    }

    
    // This function loops through all the triangles in the mesh and update the vertex normals.
    // We do this by computing the normal of each triangle and then assigning the value to each
    // vertex normal in the triangle.  If the vertex is used in multiple triangles, then the 
    // normals are averaged together.
    private recomputeNormals(): void
    {
        // Data structures to hold the normal sum and count for each vertex.
        const normalCounts: number[] = [];
        this.normals.forEach((n: gfx.Vector3) => {
            n.set(0, 0, 0);
            normalCounts.push(0);
        });

        // Loop through all the triangles.
        for(let i=0; i < this.indices.length; i+=3)
        {
            // Get three three vertices in the triangle
            const v1 = this.vertices[this.indices[i]];
            const v2 = this.vertices[this.indices[i+1]];
            const v3 = this.vertices[this.indices[i+2]];

            // Compute two edges fo the triangle
            const edge1 = gfx.Vector3.subtract(v2, v1);
            const edge2 = gfx.Vector3.subtract(v3, v1);

            // The triangle normal is the normalized cross product of the two edges
            const n = edge1.cross(edge2);
            n.normalize();

            // Add the triangle normal to each vertex normal
            this.normals[this.indices[i]].add(n);
            this.normals[this.indices[i+1]].add(n);
            this.normals[this.indices[i+2]].add(n);

            // Increment the count for each vertex normal
            normalCounts[this.indices[i]]++;
            normalCounts[this.indices[i+1]]++;
            normalCounts[this.indices[i+2]]++;
        }

        // Loop through the normals one more time to divide each by its count. This 
        // results in the average normal if the vertex is indexed in multiple triangles.
        for(let i=0; i < this.normals.length; i++)
        {
            this.normals[i].multiplyScalar(1 / normalCounts[i]);
        }

        // Assign the updated normals to the mesh
        this.setNormals(this.normals);
    }
}