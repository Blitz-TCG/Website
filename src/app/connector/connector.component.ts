import { Component, OnInit } from '@angular/core';
import { Ergo, ergoConnector } from './conn';
import { getAuth } from 'firebase/auth';

import { environment } from '../../environments/environment';
import { getDatabase, ref, child, get, update } from 'firebase/database';

// npm install sweetalert2
// import swal from 'sweetalert2';

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
    // swal.fire('You have successfully disconnected from your wallet!');
    verifyUserAndUpdateWallet('none');
    localStorage.setItem('userIsConnected', 'false');
  } catch {
    console.log(`Impossible disconnect Nautilus!`);
    // swal.fire(`Impossible disconnect Nautilus!`);
  }
});
// Disconnecting from the website button
function NautilusDisconnect() {
  try {
    ergoConnector.nautilus.disconnect();
    console.log('Button web desconnect - Now you are not connected!');
    // swal.fire('Button web desconnect - Now you are not connected!');
    verifyUserAndUpdateWallet('none');
    localStorage.setItem('userIsConnected', 'false');
  } catch {
    console.log(
      `Impossible disconnect Nautilus, check to have Nautilus installed and your internet connection!`
    );
    // swal.fire(`Impossible disconnect Nautilus, check to have Nautilus installed and your internet connection!`);
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
        }
      }
    })
  }
}
// End verify

// firebase - Verify user active and update wallet

// function verifyUserAndUpdateWallet(address: any) {
//   // user auth
//   const auth = getAuth();
//   const user = auth.currentUser;
//   if (user) {
//     console.log(`ID user: ${user?.uid}`);
//     // ddbb Config
//     const firebaseConfig = environment.firebase;
//     const database = getDatabase();
//     const dbRef = ref(database);
//     // Verify user wallet and update wallet
//     get(child(dbRef, `users/${user?.uid}/wallet`))
//       .then((snapshot) => {
//         if (snapshot.exists()) {
//           // Update database with wallet value
//           const updateWallet: any = {};
//           const datosParaActualizar = { wallet: address };
//           updateWallet[`users/${user?.uid}/wallet`] =
//             datosParaActualizar.wallet;
//           update(ref(database), updateWallet);
//         } else {
//           console.log('The update was not carried out correctly!');
//         }
//       })
//       .catch((error) => {
//         console.error(error);
//       });
//   } else {
//     console.log('There is no logged in user!');
//   }
// }

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

    // Get all users' data
    get(child(dbRef, 'users'))
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
              console.log('The wallet ID is already associated with another user.');
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
    // swal.fire(`Impossible to connect Nautilus, check to have Nautilus installed and your internet connection!`);
  }
}
// End Nautilus wallet

// getAddress connect
function getAddress() {
  try {
    ergo.get_change_address().then((address) => {
      console.log('Your connected address: ' + address);
      // swal.fire('Your connected address: ' + address);
      verifyUserAndUpdateWallet(address);
    });
  } catch (error) {
    console.log('Unable to detect wallet');
    // swal.fire('Unable to detect wallet');
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
