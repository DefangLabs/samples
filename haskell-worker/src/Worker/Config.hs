module Worker.Config
    ( Config(..)
    , loadConfig
    ) where

import System.Environment (lookupEnv)

data Config = Config
    { scyllaHost      :: String
    , scyllaPort      :: Int
    , pollIntervalSecs :: Int
    , workerName      :: String
    , natsUrl         :: String
    } deriving (Show)

loadConfig :: IO Config
loadConfig = do
    host <- envOrDefault "SCYLLA_HOST" "scylladb"
    port <- envOrDefaultInt "SCYLLA_PORT" 9042
    interval <- envOrDefaultInt "POLL_INTERVAL" 10
    name <- envOrDefault "WORKER_NAME" "haskell-worker-1"
    nats <- envOrDefault "NATS_URL" "nats://nats:4222"
    return Config
        { scyllaHost = host
        , scyllaPort = port
        , pollIntervalSecs = interval
        , workerName = name
        , natsUrl = nats
        }

envOrDefault :: String -> String -> IO String
envOrDefault key def = do
    val <- lookupEnv key
    return $ maybe def id val

envOrDefaultInt :: String -> Int -> IO Int
envOrDefaultInt key def = do
    val <- lookupEnv key
    return $ maybe def read val
