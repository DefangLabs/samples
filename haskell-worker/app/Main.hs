module Main where

import Control.Concurrent (threadDelay)
import Control.Concurrent.Async (async, waitAny)
import Control.Monad (forever)
import System.Environment (lookupEnv)
import Worker.Config (Config(..), loadConfig)
import Worker.JobProcessor (processJobs, reportHealth)
import Worker.ScyllaClient (initScylla, ensureSchema)

main :: IO ()
main = do
    putStrLn "Starting Chaos Worker (Haskell)"
    config <- loadConfig

    putStrLn $ "ScyllaDB: " ++ scyllaHost config ++ ":" ++ show (scyllaPort config)
    putStrLn $ "Poll interval: " ++ show (pollIntervalSecs config) ++ "s"

    -- Wait for ScyllaDB to be ready
    scyllaConn <- retryConnect config 10

    -- Ensure schema exists
    ensureSchema scyllaConn

    -- Run workers concurrently
    jobWorker <- async $ forever $ do
        processJobs scyllaConn config
        threadDelay (pollIntervalSecs config * 1000000)

    healthWorker <- async $ forever $ do
        reportHealth scyllaConn config
        threadDelay 30000000  -- Every 30 seconds

    putStrLn "Workers started"
    _ <- waitAny [jobWorker, healthWorker]
    putStrLn "Worker exited unexpectedly"

retryConnect :: Config -> Int -> IO ()
retryConnect config 0 = error "Failed to connect to ScyllaDB after 10 attempts"
retryConnect config n = do
    putStrLn $ "Connecting to ScyllaDB (attempt " ++ show (11 - n) ++ "/10)..."
    result <- initScylla (scyllaHost config) (scyllaPort config)
    case result of
        Right conn -> do
            putStrLn "Connected to ScyllaDB"
            return conn
        Left err -> do
            putStrLn $ "ScyllaDB not ready: " ++ show err ++ ", retrying in 5s..."
            threadDelay 5000000
            retryConnect config (n - 1)
