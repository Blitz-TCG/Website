import { Component, OnDestroy, OnInit } from '@angular/core';
import { Ergo, ergoConnector } from './conn';
import { getAuth } from 'firebase/auth';
import { WalletService } from '../wallet.service';
import { environment } from '../../environments/environment';
import { getDatabase, ref, child, get, update, query, orderByChild } from 'firebase/database';

declare global {
  const ergo: Ergo;
  const ergoConnector: ergoConnector;

  interface Window {
    ergo: Ergo;
  }
}

@Component({
  selector: 'app-connector',
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.scss'],
})

export class ConnectorComponent implements OnInit, OnDestroy {

  isConnected: boolean = false;
  constructor(private walletService: WalletService) { }

  descWallet = () => {
    this.NautilusDisconnect();
    this.walletService.setWalletConnected(false);
    this.walletService.resetTokenState();  // Reset the token state upon wallet disconnection
  };

  openConnector = () => {
    this.popupNautilus();
  }

  stateLocalstorage(): any {
    return localStorage.getItem('userIsConnected');
  }

  popupNautilus= () => {
    try {
      ergoConnector.nautilus.connect().then((access_granted) => {
        // I have a wallet connected
        console.log(access_granted);
        if (access_granted) {
          this.getAddress();
          console.log(`Nautilus confirmed`);
        } else {
          // Cancel Nautilus
          console.log(`You don't connect the wallet to the website!`);
          localStorage.setItem('userIsConnected', 'false');
          this.walletService.setWalletConnected(false);
        }
      });
    } catch (error) {
      console.error(`Impossible to connect Nautilus, check your setup and internet connection.`);
      localStorage.setItem('userIsConnected', 'false');
      this.walletService.setWalletConnected(false);
    }
  }

  getAddress = () => {
    try {
      ergo.get_change_address().then((address) => {
      console.log('Your connected address: ' + address);
      this.verifyUserAndUpdateWallet(address);
      this.walletService.setWalletConnected(true);
      this.walletService.updateWalletID(address);
        // You may also need to update the local storage and the wallet ID here
      localStorage.setItem('userIsConnected', 'true'); // Make sure to update local storage
        // Update the wallet ID in your service or component state if necessary
      });
    } catch (error) {
      console.log('Unable to detect wallet');
      this.walletService.setWalletConnected(false);
      // Similarly, handle the failure case
      localStorage.setItem('userIsConnected', 'false'); // Update local storage on failure
    }
  };

  verifyUserAndUpdateWallet = (address: any) => {
    // User auth
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
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
                alert('This wallet address is already in use by another user.');
                ergoConnector.nautilus.disconnect();
                localStorage.setItem('userIsConnected', 'false');
                this.walletService.setWalletConnected(false);
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

  // Verify none in wallet
 verifyNone= () => {
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
          //if the user signs out and signs back while keeping the wallet connected, it will ask them to reassociate the nautilus connection
          //if the user manually removes Blitz as a connect dapp in Nautilus, then they will ask to associate the wallet on login
          ergoConnector.nautilus.connect();
          console.log((localStorage.getItem('userIsConnected')));
        }
      }
    })
  }
  else{
    ergoConnector.nautilus.disconnect();
    localStorage.setItem('userIsConnected', 'false');
  }
}

 NautilusDisconnect= () => {
  try {
    ergoConnector.nautilus.disconnect();
    console.log('Wallet disconnected successfully.');
    localStorage.setItem('userIsConnected', 'false');
    this.walletService.setWalletConnected(false);
    this.verifyUserAndUpdateWallet('none'); // Indicate wallet is disconnected
  } catch (error) {
    console.error(`Impossible to disconnect Nautilus!`);
  }
}

ngOnInit(): void {

  this.verifyNone();

  // if (!localStorage.getItem('userIsConnected')) {
  //   localStorage.setItem('userIsConnected', 'false');
  // }

    this.walletService.walletConnected$.subscribe((isConnected) => {
      this.isConnected = isConnected;
      // Force change detection if necessary
    });

  // Setup the global event listener within Angular's context
  window.addEventListener('ergo_wallet_disconnected', this.handleWalletDisconnected);
}

ngOnDestroy(): void {
  // Clean up the event listener when the component is destroyed
  window.removeEventListener('ergo_wallet_disconnected', this.handleWalletDisconnected);
}

handleWalletDisconnected = () => {
  try {
    ergoConnector.nautilus.disconnect();
    console.log('You have successfully disconnected from your wallet!');
    this.verifyUserAndUpdateWallet('none'); // Using this to access component's method
    localStorage.setItem('userIsConnected', 'false');
  } catch {
    console.log(`Impossible to disconnect Nautilus!`);
  }
};
}
