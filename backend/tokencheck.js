const jwt = require('jsonwebtoken');

// Replace this with your actual access token
const accessToken = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiaXNzIjoiaHR0cHM6Ly9kZXYtNmd1dXZ2YWhudjJ1bG5paC51cy5hdXRoMC5jb20vIn0..loQnXv6g2sgo9g92.RwmmnE34BmBRpwUYFLV3KTt22rs2fkWFaCnel1Qxfr0c2QuaUqox8JK79n6QFBarpnUXBnCOhOLf1hgaaGjgHAfccT3lKaqNxJgroppO-ZdXsQ6nuK5fCkkG4cpUq3hfEs1g3pPbOkr9iT41h3-q7DSvMWjOfvpdGFmQVLa2SoT-YVC9cqBzicL0e_skRyyuEOgMh132G8gD_39G54sg_oPbePyO0uDqQ_VNGnCr2hoePF9C2HWXQL7h51FYw3aKB2WH6T5BFRAc9RmM9Uz54hobY3PsOQMSBDw4TB3K2yVixRbXEJco70qxr-RZILH9j4D0FfHyYCTlfnFe0PzXNqtVWdx8pB8.a_g5bPoG5DBAhlilvTuz-Q';

try {
    const decodedToken = jwt.decode(accessToken, { complete: true });
    if (!decodedToken) {
        throw new Error('Invalid token');
    }
    console.log('Decoded Token:', decodedToken);
} catch (error) {
    console.error('Error decoding token:', error.message);
}
