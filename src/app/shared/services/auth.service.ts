import { Expression } from '@angular/compiler';
import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import { getAuth } from 'firebase/auth';
import { first, map, take } from 'rxjs';
import { User } from './user';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: any; // Save logged in user data
  userProfile: any; // Save logged in user data
  constructor(
    public adb: AngularFireDatabase, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(async (user: any) => {
      if (user && user.emailVerified) {
        this.checkIfUserExists(user.displayName).then((snapshot: any) => {
          if (snapshot.length > 0) {
            this.userProfile = snapshot[0].payload.val();
          }
          this.userData = user;
          localStorage.setItem('user', JSON.stringify(this.userData));
          localStorage.setItem('profile', JSON.stringify(this.userProfile));
        });
      } else {
        localStorage.setItem('user', 'null');
        localStorage.setItem('profile', 'null');
        this.userData = null;
        this.userProfile = null;
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
            if (user) {
              window.location.href = '/';
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
        window.alert('Password reset email sent, check your inbox.');
      })
      .catch((error) => {
        window.alert(error);
      });
  }
  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null && user.emailVerified !== false ? true : false;
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
  NautilusDisconnect() {
    try {
      ergoConnector.nautilus.disconnect();
      console.log('Button web desconnect - Now you are not connected!');
      // this.updateWalletToNone();
      // localStorage.setItem('userIsConnected', 'false');
    } catch {
      console.log(
        `Impossible disconnect Nautilus, check to have Nautilus installed and your internet connection!`
      );
      // swal.fire(`Impossible disconnect Nautilus, check to have Nautilus installed and your internet connection!`);
    }
  }
  // Sign out
  SignOut() {
    this.NautilusDisconnect();
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
    });
  }
  getUserData(uid: any) {
    return this.adb
      .object('/users/' + uid)
      .valueChanges()
      .pipe(first());
  }
}
