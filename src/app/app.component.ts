import { ChangeDetectionStrategy, Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, Unsubscribe, setLogLevel } from 'firebase/firestore';

// Component imports (would be declared here)
import { HomeComponent } from './home/home.component';
import { SignupComponent } from './signup/signup.component';
import { AdminComponent } from './admin/admin.component';

// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar'; 
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // ADDED

// Define the shape of a Yoga Class document
export interface YogaClass {
  id: string;
  attendees: string[];
  date: any; // Using 'any' for Timestamp in this context
  isCanceled: boolean;
  location: string;
}

// Global variables provided by the environment
declare const __app_id: string;
// declare const __firebase_config: string; // REMOVED
declare const __initial_auth_token: string;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HomeComponent, 
    SignupComponent, 
    AdminComponent, 
    MatToolbarModule, 
    MatButtonModule,
    MatProgressSpinnerModule // ADDED
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  // --- Global State Signals ---
  // private app: any; // REMOVED
  private db: any;
  private auth: any;
  private unsubscribeSnapshot: Unsubscribe | null = null;

  // View control: 'home', 'signup', 'admin'
  view = signal<'home' | 'signup' | 'admin'>('home');
  // Data state
  classes = signal<YogaClass[]>([]);
  // Auth state
  userId = signal<string | null>(null);
  isAuthReady = signal(false);

  // Signup-specific state
  selectedClassId = signal<string | null>(null);

  // --- Computed Properties ---

  // Simple hardcoded admin check
  isAdmin = computed(() => this.userId() === 'admin-user-id' || this.userId()?.includes('admin'));

  // Sort classes by date, ascending
  sortedClasses = computed(() => {
    return [...this.classes()].sort((a, b) => a.date.seconds - b.date.seconds);
  });

  // Filter out canceled classes for non-admin views
  availableClasses = computed(() => {
    return this.sortedClasses().filter(cls => !cls.isCanceled);
  });

  // --- Initialization and Teardown ---

  ngOnInit() {
    this.initializeFirebase();
  }

  ngOnDestroy() {
    this.unsubscribeSnapshot && this.unsubscribeSnapshot();
  }

  async initializeFirebase() {
    try {
      // The app is now initialized in main.ts, so we get the default initialized services.
      // const firebaseConfig = JSON.parse(__firebase_config); // REMOVED
      // this.app = initializeApp(firebaseConfig); // REMOVED
      this.db = getFirestore();
      this.auth = getAuth();

      setLogLevel('debug');

      // 1. Handle Authentication
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(this.auth, __initial_auth_token);
      } else {
        await signInAnonymously(this.auth);
      }

      onAuthStateChanged(this.auth, (user: User | null) => {
        const currentUserId = user?.uid || crypto.randomUUID();
        this.userId.set(currentUserId);
        this.isAuthReady.set(true);

        // 2. Start Firestore Listener once Auth is ready
        this.setupFirestoreListener(currentUserId);
      });

    } catch (error) {
      console.error('Firebase Initialization Error:', error);
      this.isAuthReady.set(true);
    }
  }

  setupFirestoreListener(currentUserId: string) {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const classesCollectionPath = `classes`;
    const classesCollection = collection(this.db, classesCollectionPath);

    const q = query(classesCollection, orderBy('date'));

    this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const classList: YogaClass[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        classList.push({
          id: doc.id,
          attendees: data['attendees'] || [],
          date: data['date'],
          isCanceled: data['isCanceled'] || false,
          location: data['location'] || 'Studio A',
        });
      });
      this.classes.set(classList);
      console.log('Classes updated:', classList);
    }, (error) => {
      console.error('Firestore snapshot error:', error);
    });
  }

  // --- View Control ---

  changeView(newView: 'home' | 'signup' | 'admin', classId: string | null = null) {
    this.view.set(newView);
    this.selectedClassId.set(classId);
  }
}