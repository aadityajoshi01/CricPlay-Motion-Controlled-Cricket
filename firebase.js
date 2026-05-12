import { db, ref, onValue } from './firebaseConfig.js';

export function listenToFirebaseSwings(onSwingData, onConnectionChange) {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            onConnectionChange(true);
        } else {
            onConnectionChange(false);
        }
    });

    let lastProcessedTimestamp = Date.now();
    const swingRef = ref(db, 'controller/gyro/swing');
    
    onValue(swingRef, (snapshot) => {
        const data = snapshot.val();
        // Ignore stale events or duplicate triggers on reconnect
        if (data && data.swing && data.timestamp > lastProcessedTimestamp) {
            lastProcessedTimestamp = data.timestamp; // update to prevent duplicates
            onSwingData(data);
        }
    });
}
