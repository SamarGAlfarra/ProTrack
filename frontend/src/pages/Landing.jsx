import Header from '../components/Header';
import './Landing.css';
import background from '../assets/back_ground.png';
import hatRed from '../assets/Hat_red.png';
import hatBlue from '../assets/Hat_blue.png';
import hatYellow from '../assets/Hat_yellow.png';

function Landing() {
  return (
    <>
      <Header />
      <main
        className="landing-main"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="overlay">
          <h1>Manage Graduation Projects With Ease</h1>
          <p>
            An all-in-one easy-to-use platform to organize the graduation
            projects entire process.
          </p>
          <div className="roles">
            <div className="card student">
              <img src={hatRed} alt="Student" />
              <h3>STUDENT</h3>
              <p>Oversee and submit your graduation project with ease.</p>
            </div>
            <div className="card supervisor">
              <img src={hatBlue} alt="Supervisor" />
              <h3>SUPERVISOR</h3>
              <p>Guide and evaluate students’ project.</p>
            </div>
            <div className="card admin">
              <img src={hatYellow} alt="Admin" />
              <h3>ADMINISTRATOR</h3>
              <p>Organize and monitor all graduation projects.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Landing;

