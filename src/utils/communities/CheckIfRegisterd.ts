import { useStateContext } from "@/contexts/StateContext";
import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const isUserRegistered = async (
  email: string,
  community: string
): Promise<boolean> => {
  const q = query(collection(db, community), where("email", "==", email));

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return true;
  } else {
    return false;
  }
};

export const checkIfUserRegisteredInSkillSharing = async () => {
  const { user } = useStateContext();
  return await isUserRegistered(user?.email as string, "skill-sharing");
};

export const checkIfUserRegisteredInVolunteer = async () => {
  const { user } = useStateContext();
  return await isUserRegistered(user?.email as string, "volunteer");
};
