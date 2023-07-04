import { Component, OnInit } from '@angular/core';
import { Ergo, ergoConnector } from './conn';
import { getAuth } from 'firebase/auth';

import { environment } from '../../environments/environment';
import { getDatabase, ref, child, get, update, query, orderByChild } from 'firebase/database';

declare global {
  const ergo: Ergo;
  const ergoConnector: ergoConnector;

  interface Window {
    ergo: Ergo;
  }
}
// Nautilus disconnect
// Removing from Connected dApps in Nautilus
window.addEventListener('ergo_wallet_disconnected', () => {
  try {
    ergoConnector.nautilus.disconnect();
    console.log('You have successfully disconnected from your wallet!');
    verifyUserAndUpdateWallet('none');
    localStorage.setItem('userIsConnected', 'false');
  } catch {
    console.log(`Impossible disconnect Nautilus!`);
  }
});

// Disconnecting from the website button
function NautilusDisconnect() {
  try {
    localStorage.setItem('userIsConnected', 'false');
    ergoConnector.nautilus.disconnect();
    console.log('Button web desconnect - Now you are not connected!');
    verifyUserAndUpdateWallet('none');
  } catch {
    console.log(
      `Impossible disconnect Nautilus, check to have Nautilus installed and check your internet connection!`
    );
  }
}
// End Nautilus disconnect

// Verify none in wallet
function verifyNone(){
  const auth = getAuth();
  const user = auth.currentUser;
  const firebaseConfig = environment.firebase;
  const database = getDatabase();
  const dbRef = ref(database);
  if (user) {
    // I check the wallet value in firebase and if it is 'none' I show connect if not Disconnect.
    get(child(dbRef, `users/${user?.uid}/wallet`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        if(snapshot.val() === 'none') {
          localStorage.setItem('userIsConnected', 'false');
          ergoConnector.nautilus.disconnect();
        } else {
          localStorage.setItem('userIsConnected', 'true');
          //this fixes the issue where a user had a wallet connected already but we did not connect to it upon loading the page, causing an issue with detecting the application in nautilus correctly
          //if the user signs out and signs back while keeping the walled connected, it will ask them to reassociate the nautilus connection (as appropriate)
          console.log((localStorage.getItem('userIsConnected')));
          ergoConnector.nautilus.connect();
        }
      }
    })
  }
  else{
    ergoConnector.nautilus.disconnect();
    localStorage.setItem('userIsConnected', 'false');
  }
}
// End verify

function verifyUserAndUpdateWallet(address: any) {
  // User auth
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    console.log(`ID user: ${user?.uid}`);

    // DB Config
    const firebaseConfig = environment.firebase;
    const database = getDatabase();
    const dbRef = ref(database);
    const usersRef = child(dbRef, 'users');
    const usersQuery = query(usersRef, orderByChild('username')); // Order the users by the 'points' child property

    // Get all users' data
    get(usersQuery)
      .then((snapshot) => {
        if (snapshot.exists()) {
          let walletAlreadyExists = false;

          // Iterate through each user's data
          snapshot.forEach((userSnapshot) => {
            const userData = userSnapshot.val();

            // Check if the wallet address already exists for a different user
            if (userData.wallet === address && userSnapshot.key !== user?.uid && address !== "none") {
              walletAlreadyExists = true;
              console.log("user that has address: " + userSnapshot.key);
              console.log("signed in user " + user?.uid);
              console.log('Wallet ID already in use.');
              ergoConnector.nautilus.disconnect();
            }
          });

          if (!walletAlreadyExists) {
            // Update database with wallet value
            console.log("signed in user " + user?.uid);
            const updateWallet: any = {};
            const datosParaActualizar = { wallet: address };
            console.log(datosParaActualizar);
            updateWallet[`users/${user?.uid}/wallet`] = datosParaActualizar.wallet;
            update(ref(database), updateWallet);
            if (address === "none"){
              localStorage.setItem('userIsConnected', 'false');
            }
            else{
              localStorage.setItem('userIsConnected', 'true');
            }
          }
        } else {
          console.log('The update was not carried out correctly!');
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    console.log('There is no logged-in user!');
  }
}
// End firebase - Verify user active and update wallet

// Nautilus wallet
function popupNautilus() {
  try {
    ergoConnector.nautilus.connect().then((access_granted) => {
      // I have a wallet connected
      console.log(access_granted);
      if (access_granted) {
        getAddress();
        console.log(`Nautilus confirmed`);
      } else {
        // Cancel Nautilus
        localStorage.setItem('userIsConnected', 'false');
        console.log(`You don't connect the wallet to the website!`);
      }
    });
  } catch (error) {
    console.log(
      `Impossible to connect Nautilus, check to have Nautilus installed and your internet connection!`
    );
  }
}
// End Nautilus wallet

// getAddress connect
function getAddress() {
  try {
    ergo.get_change_address().then((address) => {
      console.log('Your connected address: ' + address);
      verifyUserAndUpdateWallet(address);
    });
  } catch (error) {
    console.log('Unable to detect wallet');
  }
}
// End getAddress connect

@Component({
  selector: 'app-connector',
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.scss'],
})
export class ConnectorComponent implements OnInit {

  descWallet() {
    NautilusDisconnect();
  }

  openConnector() {
    popupNautilus();
  }

  stateLocalstorage(): any {
    return localStorage.getItem('userIsConnected');
  }

  constructor() {}

  ngOnInit(): void {
    verifyNone();
    if (!localStorage.getItem('userIsConnected')) {
      localStorage.setItem('userIsConnected', 'false');
    }
  }
}
