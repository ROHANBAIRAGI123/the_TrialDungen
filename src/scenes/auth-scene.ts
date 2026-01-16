import Phaser from 'phaser';
import { auth } from '../auth/firebase-config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { SCENE_KEYS } from './scene-keys';

export class AuthScene extends Phaser.Scene {
  private isLoginMode: boolean = true;

  constructor() {
    super(SCENE_KEYS.AUTH_SCENE);
  }

  create() {
    const { width, height } = this.scale;

    // 1. Add a Title
    this.add.text(width / 2, height * 0.2, 'THE TRIAL DUNGEON', {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5);

    // 2. Create the HTML Form
    // This creates a simple HTML structure inside the game
    const element = this.add.dom(width / 2, height / 2).createFromHTML(`
      <div style="color: white; display: flex; flex-direction: column; gap: 10px; width: 250px;">
        <input type="email" id="email" placeholder="Email" style="padding: 8px;">
        <input type="password" id="password" placeholder="Password" style="padding: 8px;">
        <button id="submitBtn" style="padding: 10px; cursor: pointer; background: #4CAF50; color: white; border: none;">Login</button>
        <p id="toggleText" style="cursor: pointer; text-align: center; text-decoration: underline;">Need an account? Register</p>
        <p id="errorMessage" style="color: red; font-size: 12px; text-align: center;"></p>
      </div>
    `);

    const submitBtn = element.getChildByID('submitBtn') as HTMLButtonElement;
    const toggleText = element.getChildByID('toggleText') as HTMLElement;
    const errorDisplay = element.getChildByID('errorMessage') as HTMLElement;

    // 3. Handle Mode Toggle (Login vs Register)
    toggleText.addEventListener('click', () => {
      this.isLoginMode = !this.isLoginMode;
      submitBtn.innerText = this.isLoginMode ? 'Login' : 'Register';
      toggleText.innerText = this.isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
    });

    // 4. Handle Firebase Logic
    submitBtn.addEventListener('click', async () => {
      const email = (element.getChildByID('email') as HTMLInputElement).value;
      const password = (element.getChildByID('password') as HTMLInputElement).value;

      try {
        if (this.isLoginMode) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
        
        // Success! Move to the next scene
        this.scene.start(SCENE_KEYS.INTRO_SCENE);
      } catch (error: any) {
        errorDisplay.innerText = error.message;
      }
    });
  }
}