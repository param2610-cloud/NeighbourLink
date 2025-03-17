import { db } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

export const fetchSingleDocument = async (collectionName:string,docId:string)=>{
    try {
        const docRef = doc(db,collectionName,docId);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
            return docSnap.data();
        }else{
            console.log("No Such Document exists");
            return null;
        }
    } catch (error) {
        console.error("Error Fetching Document from firestore: ",error)
    }
}