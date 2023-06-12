using UnityEngine;
using UnityEngine.SceneManagement;

public class zzzDummyBack : MonoBehaviour
{
    public void BackButton()
    {
        SceneManager.LoadSceneAsync(1);
    }

}
