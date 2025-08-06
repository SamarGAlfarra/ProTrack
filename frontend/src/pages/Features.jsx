import Header from '../components/Header';
import './Landing.css';
import background from '../assets/back_ground.png';
import folder from '../assets/folder.png';
import task from '../assets/task.png';
import progress from '../assets/progress.png';
import feedback from '../assets/feedback.png';

function Features() {
  return (
    <>
      <Header />
      <main
        className="landing-main"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="overlay">
          <h1>Features</h1>
          <h3 className="h3-margin" >
            An intuitive platform with powerful features to simplify graduation project management
          </h3>
          <div className="roles">
            <div className="card student">
              <img src={folder} alt="Student" />
              <h3>Project Repository</h3>
              <p>Store and manage all graduation projects in centralized repository</p>
            </div>
            <div className="card supervisor">
              <img src={task} alt="Supervisor" />
              <h3>Task Management</h3>
              <p>Assign and track tasks for each graduation project easily</p>
            </div>
            <div className="card admin">
              <img src={progress} alt="Admin" />
              <h3>Progress Tracking</h3>
              <p>Monitor the progress of graduation projects in real-time</p>
            </div>
            <div className="card admin">
              <img src={feedback} alt="Admin" />
              <h3>Evaluation & Feedback</h3>
              <p>Evaluate projects and provide feedback efficiently</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Features;

