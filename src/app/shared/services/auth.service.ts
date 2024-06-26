import { isPlatformBrowser } from '@angular/common';
import { Expression } from '@angular/compiler';
import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import { getAuth } from 'firebase/auth';
import { BehaviorSubject, first, map, take } from 'rxjs';
import { User } from './user';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: any; // Save logged in user data
  userProfile: any; // Save logged in user data
  currentUserXP: number = 0; // To store current user XP
    // Add BehaviorSubject for userLevel
    private userLevelSubject = new BehaviorSubject<string>('1');
    // Expose as observable
    public userLevel$ = this.userLevelSubject.asObservable();
  constructor(
    public adb: AngularFireDatabase, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone, // NgZone service to remove outside scope warning
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(async (user: any) => {
      if (isPlatformBrowser(this.platformId)) {
        if (user && user.emailVerified) {
          this.checkIfUserExists(user.displayName).then((snapshot: any) => {
            if (snapshot.length > 0) {
              this.userProfile = snapshot[0].payload.val();
            }
            this.userData = user;
            localStorage.setItem('user', JSON.stringify(this.userData));
            localStorage.setItem('profile', JSON.stringify(this.userProfile));
            //console.log(`User ID: ${JSON.stringify(this.userData)}`);

            this.loadUserXP(user.uid).then((userLevel) => {
              // Now that we have the level, let's store it in localStorage
              localStorage.setItem('level', userLevel.toString());
              this.userLevelSubject.next(userLevel.toString()); // Update BehaviorSubject
            });
          });
        } else {
          localStorage.setItem('user', 'null');
          localStorage.setItem('profile', 'null');
          localStorage.removeItem('level');
          this.userLevelSubject.next('1'); // Reset level in BehaviorSubject
          this.userData = null;
          this.userProfile = null;
        }
      }
    });
  }
  // Sign in with email/password
  SignIn(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        if (result.user?.emailVerified) {
          this.afAuth.authState.subscribe((user) => {
            if (isPlatformBrowser(this.platformId)) {
              if (user) {
                window.location.href = '/';
              }
            }
          });
        } else {
          const error = {
            code: 'auth/verify-email',
            message: 'Please verify your email',
          };
          throw error;
        }
      })
      .catch((error) => {
        throw error;
      });
  }
  // Sign up with email/password
  async SignUp(email: string, username: string, password: string) {
    const data = await this.checkIfUserExists(username);
    if (data.length === 0) {
      return this.afAuth
        .createUserWithEmailAndPassword(email, password)
        .then((result) => {
          result.user?.updateProfile({
            displayName: username,
          });
          /* Call the SendVerificaitonMail() function when new user sign
            up and returns promise */
          this.SendVerificationMail();
          this.SetUserData(username, email, result.user?.uid);
        });
    } else {
      const error = new Error('Username in use, choose a different username');
      error.name = 'USERNAME_EXISTS';
      throw error;
    }
  }
  // Send email verfificaiton when new user sign up
  SendVerificationMail() {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['verify-email-address']);
      });
  }
  // Reset Forggot password
  ForgotPassword(passwordResetEmail: string) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        if (isPlatformBrowser(this.platformId)) {
          window.alert('Password reset email sent, check your inbox.');
        }
      })
      .catch((error) => {
        if (isPlatformBrowser(this.platformId)) {
          window.alert(error);
        }
      });
  }
  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const user = JSON.parse(localStorage.getItem('user')!);
      return user !== null && user.emailVerified !== false ? true : false;
    }
    return false;
  }
  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(username: string, email: string, uid?: string) {
    if (uid) {
      const userRef = this.adb.list(`users`);
      const userData: User = {
        email,
        username: username,
        userID: uid,
        pfp: 'default',
        online: 'F',
        wallet: 'none',
        creationDate: Date.now().toString(),
      };
      userRef.set(uid, userData);
    }
  }
  checkIfUserExists(username: string): any {
    const userRef = this.adb
      .list(`users`, (ref) => ref.orderByChild('username').equalTo(username))
      .snapshotChanges()
      .pipe(take(1))
      .toPromise();
    return userRef;
  }
  updateWalletToNone() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        const usersRef = this.adb.list('users');
        usersRef.update(user?.uid, { wallet: 'none' });
      }
    });

  }

// Fetch the XP amount from Firebase and store it
async loadUserXP(userID: string): Promise<number> {
  try {
    const xp = await this.adb.object(`open/${userID}/xpOpen`).valueChanges().pipe(first()).toPromise() as number;
    if (xp) {
      this.currentUserXP = +xp;
      const userLevel = this.calculateLevelFromXp(this.currentUserXP);
      console.log(`User XP: ${this.currentUserXP}`);
      console.log(`User Level: ${userLevel}`);
      return userLevel; // Return the calculated user level
    } else {
      console.log(`XP for user ID ${userID} not found.`);
      return 1; // Or some default level if XP is not found
    }
  } catch (error) {
    console.error("Error fetching user's experience:", error);
    return 0; // Return a default level in case of an error
  }
}

private calculateLevelFromXp(xp: number): number {
  if (xp < 25) return 1;
  let level = Math.floor((Math.sqrt(xp) + 5) / 5);
  return level;
}

  //controls what happens when a user signs out while a wallet is associated
  NautilusDisconnect() {
    try {
      //ergoConnector.nautilus.disconnect(); // if this is enabled, then the user has to confirm a nautilus query every time they log in, which does not seem good
      //it will only ask them to reconfirm their wallet if they are signing into multiple accounts, which they shouldn't be for a given wallet anyways
      console.log('Button web desconnect - Now you are not connected!');
    } catch {
      console.log(
        `Impossible disconnect Nautilus, check to have Nautilus installed and your internet connection!`
      );
    }
  }
  // Sign out
  SignOut() {
    this.NautilusDisconnect();
    return this.afAuth.signOut().then(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('user');
      }
    });
  }
  getUserData(uid: any) {
    return this.adb
      .object('/users/' + uid)
      .valueChanges()
      .pipe(first());
  }
}
