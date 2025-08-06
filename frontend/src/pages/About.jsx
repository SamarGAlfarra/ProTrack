import Header from '../components/Header';
import './Landing.css';
import background from '../assets/back_ground.png';
import efficiency from '../assets/effectiveness.png';
import simplicity from '../assets/simplicity.png';
import collaboration from '../assets/collaborate.png';

function About() {
  return (
    <>
      <Header />
      <main
        className="landing-main"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="overlay">
          <h1>About Us</h1>
          <p>
            Born out of real challenges faced by students and staff, our platform was <br/>
            created to turn the complex graduation project cycle into a seamless <br/>
            experience for everyone involved.<br/>
          </p>
          <h2>Our Core Values</h2>
          <div className="roles">
            <div className="card student">
              <img src={efficiency} alt="Student" />
              <h3>Efficiency</h3>
              <p>Our aim is to optimize and expedite the project process</p>
            </div>
            <div className="card supervisor">
              <img src={simplicity} alt="Supervisor" />
              <h3>Simplicity</h3>
              <p>We believe in keeping things simple and user-friendly</p>
            </div>
            <div className="card admin">
              <img src={collaboration} alt="Admin" />
              <h3>Collaboration</h3>
              <p>Fostering teamwork is at the heart of our platform</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default About;

