using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class zzoldcode : MonoBehaviour
{

    /*    [SerializeField]
    private TMP_InputField profilePictureLink;*/

/*    public void CloseChangePfpUI() //profile dropdown ui interactions
    {
        if (changePfpUI.activeSelf)
        {
            changePfpUI.SetActive(false);
        }
        else if (!changePfpUI.activeSelf)
        {
            changePfpUI.SetActive(true);
            //profilePictureLink.Select();
        }

        ClearUI();
    }*/

    /*    public void ClearUI() //clear ui text fields
        {
            outputText.text = ""; //pfp banner ui related
            //profilePictureLink.text = "";

            friendsAddInputField.text = ""; //friends list ui related
            friendsRemoveInputField.text = "";
            outputTextFriendsErorr.text = "";
            outputTextFriendsSuccess.text = "";
        }*/

    /*        if (changePfpUI.activeSelf && !profilePictureLink.isFocused)
    {
        if (Input.GetKeyDown(KeyCode.Tab) || Input.GetKeyDown(KeyCode.KeypadEnter) || Input.GetKeyDown(KeyCode.Return))
        {
            StartCoroutine(SelectChangePFPInputField());
        }
    }*/

    /*        if (Input.GetKeyDown(KeyCode.Escape) && !settingsUI.activeSelf && !friendsUI.activeSelf && !changePfpUI.activeSelf && profileDropdown.activeSelf)
            {
                profileDropdown.SetActive(false);
            }

            if (changePfpUI.activeSelf && changePfpUI != null)
            {
                *//*            if (Input.GetKeyDown(KeyCode.Tab))
                            {
                                profilePictureLink.Select();
                            }*/

    /*            if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
                {
                    SubmitProfileImageButton();
                }*//*

    if (Input.GetKeyDown(KeyCode.Escape) && !settingsUI.activeSelf && !friendsUI.activeSelf)
    {
        changePfpUI.SetActive(false);
        ClearUI();
    }
}*/

}
    /*    public void LoadProfile() //loading firebase auth info to profile banner
        {
            if (FirebaseManager.instance.user != null)
            {
                //System.Uri photoUrl = FirebaseManager.instance.user.PhotoUrl;
                string name = FirebaseManager.instance.user.DisplayName;

                //StartCoroutine(LoadImage(photoUrl.ToString())); //passing the photo url from the firebase user to the coroutine //todo - remove all of this and set to local, don't forget to have default image too (default)
                StartCoroutine(LoadImage());

                usernameText.text = name;
            }
        }*/

    /*    private IEnumerator LoadImage(string _photoURL) //getting the profile image and loading it
        {
            UnityWebRequest request = UnityWebRequestTexture.GetTexture(_photoURL);
            yield return request.SendWebRequest();
            if (request.error != null)
            {
                string output = "";

                if (request.result == UnityWebRequest.Result.ProtocolError) //todo: need to find a better error checker here, might not be needed
                {
                    output = "Image type not supported, please use a different image";
                }
                else
                {
                    output = "Unknown error while loading image";
                }

                profileDropdown.SetActive(true);
                changePfpUI.SetActive(true);
                Output(output);
                profileImageLoading.SetActive(false);
            }
            else
            {
                Texture2D image = ((DownloadHandlerTexture)request.downloadHandler).texture;
                profilePicture.sprite = Sprite.Create(image, new Rect(0, 0, image.width, image.height), Vector2.zero);

                profileDropdown.SetActive(false);
                changePfpUI.SetActive(false);
                profileImageLoading.SetActive(false);
            }
        }*/

    //
    //update PFP
    //
    /*    public void SubmitProfileImageButton() //passing a new image to firebase to update a user's pfp
        {
            if (!friendsUI.activeSelf && !settingsUI.activeSelf)
            {
                outputText.text = "";
                if (!profilePictureLink.text.Contains(".png") && !profilePictureLink.text.Contains(".jpg")
                    && !profilePictureLink.text.Contains(".jpeg"))
                {
                    string output = "Image must be a .png, .jpg, or .jpeg";
                    Output(output);
                }
                else
                {
                    StartCoroutine(UpdateProfilePictureLogic(profilePictureLink.text));
                }
            }
        }
        private IEnumerator UpdateProfilePictureLogic(string _newPfpURL) //pfp update from the Main Menu UI, might make sense to move it to that script
        {
            profileImageLoading.SetActive(true);

            FirebaseUser user = FirebaseManager.instance.user;

            if (user != null)
            {
                UserProfile profile = new UserProfile();

                try
                {
                    UserProfile _profile = new UserProfile
                    {
                        PhotoUrl = new System.Uri(_newPfpURL),
                    };

                    profile = _profile;
                }
                catch
                {
                    MainMenuUIManager.instance.Output("Error fetching image, make sure your link is a direct link");
                    profileImageLoading.SetActive(false);
                    yield break;
                }

                var pfpTask = user.UpdateUserProfileAsync(profile);
                yield return new WaitUntil(predicate: () => pfpTask.IsCompleted);

                if (pfpTask.Exception != null)
                {
                    Debug.Log($"Updating Profile Picture was unsuccessful {pfpTask.Exception}");
                    profileImageLoading.SetActive(false);
                }
                else
                {
                    var setData = dbReference.Child("users").Child(userID).Child("pfp").SetValueAsync(_newPfpURL);
                    yield return new WaitUntil(predicate: () => setData.IsCompleted); //todo maybe add some exception checking
                    LoadProfile();
                }
            }
        }

        IEnumerator SelectChangePFPInputField() //ensureing the text fields are selectable without causing any bugs from the update function
        {
            yield return new WaitForEndOfFrame();
            profilePictureLink.ActivateInputField();
        }*/

