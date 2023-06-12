using UnityEngine;
using UnityEngine.SceneManagement;
using TMPro;


public class GameManager : MonoBehaviour
{
    //Other Variables
    public static GameManager instance;

    private void Awake()
    {
        DontDestroyOnLoad(gameObject);

        if (instance == null)
        {
            instance = this;
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }

    public void ChangeScene(int _sceneIndex)
    {
        SceneManager.LoadSceneAsync(_sceneIndex);
    }

}
